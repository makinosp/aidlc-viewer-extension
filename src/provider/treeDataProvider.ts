import * as vscode from 'vscode';
import { FileState, MarkdownMetadata, DirectoryStats, StageSummary, TreeItem } from '../types';
import { detectStageFromPath, inferStageFromCounts } from '../model/stage';
import {
  createFileItem,
  sortItems,
  formatDirectoryDescription,
  buildDirectoryTooltip,
  formatFileDescription,
  buildFileTooltip,
  getDirectoryIconName,
  getDirectorySectionHint,
  getDirectoryColor,
  formatStageLabel,
  formatStageDescription,
  buildStageTooltip,
  getStageIcon,
  getStageColor,
  capitalize,
  getItemSortRank,
  getStageDirectoryOrder,
  getFileVisualState,
  getDirectoryVisualState,
  ensureTrailingSlash,
  collectMarkdownFiles
} from '../utils/index';

export class MarkdownTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private rootUri: vscode.Uri | undefined;
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private metadataCache = new Map<string, MarkdownMetadata>();
  private directoryStatsCache = new Map<string, DirectoryStats>();
  private stageSummaryCache = new Map<string, StageSummary>();
  private openedFiles = new Set<string>();
  private knownFiles = new Set<string>();
  private newFiles = new Set<string>();

  setFileState(openedFiles: Set<string>, knownFiles: Set<string>, newFiles: Set<string>) {
    this.openedFiles = new Set(openedFiles);
    this.knownFiles = new Set(knownFiles);
    this.newFiles = new Set(newFiles);
    this.refresh();
  }

  setRootUri(rootUri: vscode.Uri | undefined) {
    this.rootUri = rootUri;
    this.refresh();
  }

  refresh() {
    this.metadataCache.clear();
    this.directoryStatsCache.clear();
    this.stageSummaryCache.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.rootUri) {
      return [
        new InfoItem('Select a folder to start watching', 'Run "Markdown Watch Viewer: Select Folder".')
      ];
    }

    if (!element) {
      const stageSummary = await this.getStageSummary(this.rootUri);
      const entries = await this.getDirectoryEntries(this.rootUri);
      return [new StageItem(stageSummary), ...entries];
    }

    return this.getDirectoryEntries(element.resourceUri!);
  }

  async getDirectoryEntries(targetUri: vscode.Uri): Promise<TreeItem[]> {
    const entries = await vscode.workspace.fs.readDirectory(targetUri);

    const rawItems = await Promise.all(
      entries
        .filter(([name]) => !name.startsWith('.'))
        .map(async ([name, fileType]) => {
          const childUri = vscode.Uri.joinPath(targetUri, name);
          const isDirectory = fileType === vscode.FileType.Directory;
          if (isDirectory) {
            const stats = await this.getDirectoryStats(childUri);
            if (!stats.hasMarkdown) {
              return undefined;
            }

            return new DirectoryItem(
              childUri,
              stats,
              getDirectoryVisualState(childUri, this.openedFiles, this.knownFiles, this.newFiles)
            );
          }

          return createFileItem(
            childUri,
            fileType,
            await this.getMarkdownMetadata(childUri),
            getFileVisualState(childUri, this.openedFiles, this.knownFiles, this.newFiles)
          );
        })
    );

    const items = rawItems.filter(Boolean).sort(sortItems);

    return items;
  }

  async getStageSummary(rootUri: vscode.Uri): Promise<StageSummary> {
    const cacheKey = rootUri.toString();
    if (this.stageSummaryCache.has(cacheKey)) {
      return this.stageSummaryCache.get(cacheKey)!;
    }

    const markdownFiles = await collectMarkdownFiles(rootUri);
    const counts = {
      inception: 0,
      construction: 0,
      operations: 0
    };
    let latest: { stage: string; fileUri: vscode.Uri; mtime: number } | undefined;

    for (const fileUri of markdownFiles) {
      const stage = detectStageFromPath(fileUri.fsPath);
      if (!stage) {
        continue;
      }

      counts[stage] += 1;

      try {
        const stat = await vscode.workspace.fs.stat(fileUri);
        const candidate = {
          stage,
          fileUri,
          mtime: stat.mtime
        };
        if (!latest || candidate.mtime > latest.mtime) {
          latest = candidate;
        }
      } catch {
        continue;
      }
    }

    const currentStage = latest?.stage || inferStageFromCounts(counts);
    const summary: StageSummary = {
      currentStage,
      counts,
      latestFile: latest?.fileUri,
      latestModifiedLabel: latest?.fileUri ? vscode.workspace.asRelativePath(latest.fileUri) : undefined
    };

    this.stageSummaryCache.set(cacheKey, summary);
    return summary;
  }

  async getMarkdownMetadata(resourceUri: vscode.Uri): Promise<MarkdownMetadata | undefined> {
    if (!resourceUri.fsPath.toLowerCase().endsWith('.md')) {
      return undefined;
    }

    const cacheKey = resourceUri.toString();
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey)!;
    }

    try {
      const bytes = await vscode.workspace.fs.readFile(resourceUri);
      const content = Buffer.from(bytes).toString('utf8');
      const lines = content.split(/\r?\n/);
      const heading = lines.find((line) => line.startsWith('# '))?.replace(/^#\s+/, '').trim();
      const summary = lines
        .find((line) => line.trim() && !line.startsWith('#') && !line.startsWith('```'))
        ?.trim();

      const metadata: MarkdownMetadata = { heading, summary };
      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch {
      const metadata: MarkdownMetadata = { heading: undefined, summary: undefined };
      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    }
  }

  async getDirectoryStats(resourceUri: vscode.Uri): Promise<DirectoryStats> {
    const cacheKey = resourceUri.toString();
    if (this.directoryStatsCache.has(cacheKey)) {
      return this.directoryStatsCache.get(cacheKey)!;
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(resourceUri);
      let markdownCount = 0;
      let childDirectoryCount = 0;
      let hasMarkdown = false;

      for (const [name, fileType] of entries) {
        if (name.startsWith('.')) {
          continue;
        }

        const childUri = vscode.Uri.joinPath(resourceUri, name);
        if (fileType === vscode.FileType.File && name.toLowerCase().endsWith('.md')) {
          markdownCount += 1;
          hasMarkdown = true;
          continue;
        }

        if (fileType === vscode.FileType.Directory) {
          const childStats = await this.getDirectoryStats(childUri);
          if (childStats.hasMarkdown) {
            hasMarkdown = true;
            childDirectoryCount += 1;
          }
        }
      }

      const stats: DirectoryStats = { hasMarkdown, markdownCount, childDirectoryCount };
      this.directoryStatsCache.set(cacheKey, stats);
      return stats;
    } catch {
      const stats: DirectoryStats = { hasMarkdown: false, markdownCount: 0, childDirectoryCount: 0 };
      this.directoryStatsCache.set(cacheKey, stats);
      return stats;
    }
  }

  /**
   * Dispose of resources used by the tree data provider.
   * This should be called when the extension is deactivated.
   */
  dispose() {
    this._onDidChangeTreeData.dispose();
  }
}

class InfoItem extends vscode.TreeItem {
  constructor(label: string, description: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.contextValue = 'info';
  }
}

class StageItem extends vscode.TreeItem {
  constructor(summary: StageSummary) {
    super(formatStageLabel(summary), vscode.TreeItemCollapsibleState.None);
    this.description = formatStageDescription(summary);
    this.tooltip = buildStageTooltip(summary);
    this.contextValue = 'stageSummary';
    this.iconPath = new vscode.ThemeIcon(getStageIcon(summary.currentStage), getStageColor(summary.currentStage));
  }
}

class DirectoryItem extends vscode.TreeItem {
  constructor(resourceUri: vscode.Uri, stats: DirectoryStats, visualState: { hasNew: boolean; newCount: number; readCount: number }) {
    super(vscode.workspace.asRelativePath(resourceUri), vscode.TreeItemCollapsibleState.Collapsed);
    this.resourceUri = resourceUri;
    this.type = 'directory';
    this.contextValue = 'directory';
    this.description = formatDirectoryDescription(stats, visualState);
    this.tooltip = buildDirectoryTooltip(resourceUri, stats, visualState);
    this.iconPath = new vscode.ThemeIcon(
      getDirectoryIconName(resourceUri),
      getDirectoryColor(resourceUri, visualState)
    );
  }
}

class MarkdownFileItem extends vscode.TreeItem {
  constructor(resourceUri: vscode.Uri, metadata: MarkdownMetadata | undefined, visualState: FileState) {
    super(vscode.workspace.asRelativePath(resourceUri), vscode.TreeItemCollapsibleState.None);
    this.resourceUri = resourceUri;
    this.type = 'file';
    this.contextValue = 'markdownFile';
    this.description = formatFileDescription(metadata, visualState);
    this.tooltip = buildFileTooltip(resourceUri, metadata, visualState);
    this.iconPath = new vscode.ThemeIcon(
      visualState === 'new' ? 'circle-filled' : visualState === 'read' ? 'pass-filled' : 'file',
      visualState === 'new' ? new vscode.ThemeColor('charts.green') : visualState === 'read' ? new vscode.ThemeColor('disabledForeground') : undefined
    );
    this.command = {
      command: 'markdownWatchViewer.openFile',
      title: 'Open Markdown File',
      arguments: [this]
    };
  }
}

class OtherFileItem extends vscode.TreeItem {
  constructor(resourceUri: vscode.Uri) {
    super(vscode.workspace.asRelativePath(resourceUri), vscode.TreeItemCollapsibleState.None);
    this.resourceUri = resourceUri;
    this.type = 'file';
    this.contextValue = 'file';
    this.description = vscode.workspace.asRelativePath(resourceUri, true);
  }
}

// Utility function to create a file item based on file type and metadata
function createFileItem(resourceUri: vscode.Uri, fileType: vscode.FileType, metadata: MarkdownMetadata | undefined, visualState: FileState): MarkdownFileItem | OtherFileItem | undefined {
  if (fileType !== vscode.FileType.File) {
    return undefined;
  }

  if (resourceUri.fsPath.toLowerCase().endsWith('.md')) {
    return new MarkdownFileItem(resourceUri, metadata, visualState);
  }

  return new OtherFileItem(resourceUri);
}

// Export the classes for use in other modules
export { InfoItem, StageItem, DirectoryItem, MarkdownFileItem, OtherFileItem };
