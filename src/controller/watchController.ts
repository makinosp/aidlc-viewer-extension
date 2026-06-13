import * as vscode from 'vscode';
import { MarkdownTreeDataProvider } from '../provider/treeDataProvider';
import { collectMarkdownFiles } from '../utils/fileOps';
import { getWebviewHtml } from '../webview/template';

const STATE_KEY = 'markdownWatchViewer.watchedFolder';
const OPENED_KEY = 'markdownWatchViewer.openedFiles';
const KNOWN_KEY = 'markdownWatchViewer.knownFiles';
const NEW_KEY = 'markdownWatchViewer.newFiles';

export class WatchController {
  private context: vscode.ExtensionContext;
  public treeDataProvider: MarkdownTreeDataProvider;
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private previewPanels: Map<string, vscode.WebviewPanel>;
  private openedFiles: Set<string>;
  private knownFiles: Set<string>;
  private newFiles: Set<string>;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.treeDataProvider = new MarkdownTreeDataProvider();
    this.previewPanels = new Map();
    this.openedFiles = new Set(context.workspaceState.get(OPENED_KEY, []));
    this.knownFiles = new Set(context.workspaceState.get(KNOWN_KEY, []));
    this.newFiles = new Set(context.workspaceState.get(NEW_KEY, []));
    this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
  }

  async restoreWatcher() {
    const storedFolder = this.context.workspaceState.get<string>(STATE_KEY);
    if (!storedFolder) {
      this.treeDataProvider.setRootUri(undefined);
      return;
    }

    const uri = vscode.Uri.file(storedFolder);
    try {
      await vscode.workspace.fs.stat(uri);
      await this.setWatchedFolder(uri, { showMessage: false });
    } catch {
      this.context.workspaceState.update(STATE_KEY, undefined);
      this.treeDataProvider.setRootUri(undefined);
      vscode.window.showWarningMessage('Previously watched folder was not found. Please select a new one.');
    }
  }

  async selectFolder() {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Watch this folder'
    });

    if (!selection || !selection[0]) {
      return;
    }

    await this.setWatchedFolder(selection[0], { showMessage: true });
  }

  async setWatchedFolder(folderUri: vscode.Uri, options: { showMessage: boolean } = { showMessage: true }) {
    this.disposeWatcher();
    this.treeDataProvider.setRootUri(folderUri);
    await this.context.workspaceState.update(STATE_KEY, folderUri.fsPath);
    await this.primeKnownFiles(folderUri);

    const pattern = new vscode.RelativePattern(folderUri, '**/*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    const refresh = () => this.refresh();
    this.fileWatcher.onDidCreate(async (uri) => {
      await this.handleCreate(uri);
      refresh();
    });
    this.fileWatcher.onDidDelete(refresh);
    this.fileWatcher.onDidChange((uri) => {
      refresh();
      this.notifyOpenPreview(uri);
    });

    if (options.showMessage) {
      vscode.window.showInformationMessage(`Watching folder: ${folderUri.fsPath}`);
    }

    this.refresh();
  }

  refresh() {
    this.treeDataProvider.refresh();
  }

  async openFile(item: vscode.TreeItem) {
    if (!item || item.type !== 'file') {
      return;
    }

    await this.markFileOpened(item.resourceUri!);

    const key = item.resourceUri!.toString();
    let panel = this.previewPanels.get(key);

    if (panel) {
      panel.reveal(vscode.ViewColumn.One);
      await this.updatePreview(panel, item.resourceUri!);
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'markdownWatchViewer.editor',
      vscode.workspace.asRelativePath(item.resourceUri!),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.previewPanels.set(key, panel);
    panel.onDidDispose(() => {
      this.previewPanels.delete(key);
    });

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'save') {
        await this.saveMarkdown(item.resourceUri!, message.content);
        return;
      }

      if (message.type === 'requestLatest') {
        await this.updatePreview(panel, item.resourceUri!);
      }
    });

    await this.updatePreview(panel, item.resourceUri!);
  }

  async updatePreview(panel: vscode.WebviewPanel, fileUri: vscode.Uri) {
    const bytes = await vscode.workspace.fs.readFile(fileUri);
    const content = Buffer.from(bytes).toString('utf8');
    panel.title = vscode.workspace.asRelativePath(fileUri);
    panel.webview.html = getWebviewHtml(panel.webview, fileUri, content);
  }

  async saveMarkdown(fileUri: vscode.Uri, content: string) {
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
    vscode.window.showInformationMessage(`Saved ${vscode.workspace.asRelativePath(fileUri)}`);
    this.refresh();
  }

  async notifyOpenPreview(uri: vscode.Uri) {
    const panel = this.previewPanels.get(uri.toString());
    if (!panel) {
      return;
    }

    await this.updatePreview(panel, uri);
  }

  disposeWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = undefined;
    }
  }

  async handleCreate(uri: vscode.Uri) {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type === vscode.FileType.File && uri.fsPath.toLowerCase().endsWith('.md')) {
        this.knownFiles.add(uri.toString());
        this.newFiles.add(uri.toString());
        this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
        await this.context.workspaceState.update(KNOWN_KEY, [...this.knownFiles]);
        await this.context.workspaceState.update(NEW_KEY, [...this.newFiles]);
        return;
      }

      if (stat.type === vscode.FileType.Directory) {
        const files = await collectMarkdownFiles(uri);
        let changed = false;
        for (const file of files) {
          const key = file.toString();
          if (!this.knownFiles.has(key)) {
            this.knownFiles.add(key);
            this.newFiles.add(key);
            changed = true;
          }
        }
        if (changed) {
          this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
          await this.context.workspaceState.update(KNOWN_KEY, [...this.knownFiles]);
          await this.context.workspaceState.update(NEW_KEY, [...this.newFiles]);
        }
      }
    } catch {
      return;
    }
  }

  async markFileOpened(fileUri: vscode.Uri) {
    const key = fileUri.toString();
    if (!this.knownFiles.has(key)) {
      this.knownFiles.add(key);
      await this.context.workspaceState.update(KNOWN_KEY, [...this.knownFiles]);
    }

    if (!this.openedFiles.has(key)) {
      this.openedFiles.add(key);
    }

    if (this.newFiles.has(key)) {
      this.newFiles.delete(key);
    }

    this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
    await this.context.workspaceState.update(OPENED_KEY, [...this.openedFiles]);
    await this.context.workspaceState.update(NEW_KEY, [...this.newFiles]);
    this.refresh();
  }

  async primeKnownFiles(folderUri: vscode.Uri) {
    const existingFiles = await collectMarkdownFiles(folderUri);
    const existingSet = new Set(existingFiles.map((file) => file.toString()));

    this.openedFiles = new Set([...this.openedFiles].filter((key) => existingSet.has(key)));
    this.knownFiles = new Set([...existingSet, ...this.knownFiles].filter((key) => existingSet.has(key)));
    this.newFiles = new Set([...this.newFiles].filter((key) => existingSet.has(key) && !this.openedFiles.has(key)));

    this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
    await this.context.workspaceState.update(OPENED_KEY, [...this.openedFiles]);
    await this.context.workspaceState.update(KNOWN_KEY, [...this.knownFiles]);
    await this.context.workspaceState.update(NEW_KEY, [...this.newFiles]);
  }
}
