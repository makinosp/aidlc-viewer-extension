"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));

// src/controller/watchController.ts
var vscode4 = __toESM(require("vscode"));

// src/provider/treeDataProvider.ts
var vscode3 = __toESM(require("vscode"));

// src/model/stage.ts
function detectStageFromPath2(filePath) {
  const normalized = filePath.toLowerCase();
  if (normalized.includes("/operations/")) {
    return "operations";
  }
  if (normalized.includes("/construction/")) {
    return "construction";
  }
  if (normalized.includes("/inception/")) {
    return "inception";
  }
  return void 0;
}
function inferStageFromCounts(counts) {
  if (counts.operations > 0) {
    return "operations";
  }
  if (counts.construction > 0) {
    return "construction";
  }
  if (counts.inception > 0) {
    return "inception";
  }
  return "unknown";
}

// src/utils/formatting.ts
function formatStageLabel(summary) {
  if (summary.currentStage === "unknown") {
    return "Current Stage: Unknown";
  }
  return `Current Stage: ${capitalize(summary.currentStage)}`;
}
function formatStageDescription(summary) {
  const parts = [];
  if (summary.counts.inception > 0) {
    parts.push(`I ${summary.counts.inception}`);
  }
  if (summary.counts.construction > 0) {
    parts.push(`C ${summary.counts.construction}`);
  }
  if (summary.counts.operations > 0) {
    parts.push(`O ${summary.counts.operations}`);
  }
  return parts.join(" \u2022 ") || "No stage files detected";
}
function formatDirectoryDescription(stats, visualState) {
  const parts = [];
  if (visualState.newCount > 0) {
    parts.push(`${visualState.newCount} new`);
  }
  if (visualState.readCount > 0) {
    parts.push(`${visualState.readCount} read`);
  }
  if (stats.markdownCount > 0) {
    parts.push(`${stats.markdownCount} md`);
  }
  if (stats.childDirectoryCount > 0) {
    parts.push(`${stats.childDirectoryCount} dirs`);
  }
  return parts.join(" \u2022 ");
}
function formatFileDescription(metadata, visualState) {
  const stateLabel = visualState === "new" ? "NEW" : visualState === "read" ? "READ" : void 0;
  return [stateLabel, metadata?.heading].filter(Boolean).join(" \u2022 ");
}
function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value || "";
}
function buildStageTooltip(summary) {
  return [
    `Detected stage: ${summary.currentStage === "unknown" ? "unknown" : capitalize(summary.currentStage)}`,
    `Inception files: ${summary.counts.inception}`,
    `Construction files: ${summary.counts.construction}`,
    `Operations files: ${summary.counts.operations}`,
    summary.latestFile ? `Latest stage file: ${summary.latestFile.fsPath}` : "No stage file detected yet"
  ].filter(Boolean).join("\n");
}
function buildDirectoryTooltip(resourceUri, stats, visualState) {
  const sectionHint = getDirectorySectionHint(resourceUri);
  return [
    resourceUri.fsPath,
    sectionHint,
    visualState.newCount > 0 ? `New markdown files below: ${visualState.newCount}` : "No new markdown files",
    visualState.readCount > 0 ? `Read markdown files below: ${visualState.readCount}` : void 0,
    `Markdown files here: ${stats.markdownCount}`,
    `Child folders with markdown: ${stats.childDirectoryCount}`
  ].filter(Boolean).join("\n");
}
function buildFileTooltip(resourceUri, metadata, visualState) {
  return [
    resourceUri.fsPath,
    visualState === "new" ? "New file since watching started" : visualState === "read" ? "Opened in the viewer" : "Existing file in watched folder",
    metadata?.heading,
    metadata?.summary
  ].filter(Boolean).join("\n");
}

// src/utils/fileOps.ts
var vscode = __toESM(require("vscode"));
async function collectMarkdownFiles(rootUri) {
  const results = [];
  async function walk(currentUri) {
    const entries = await vscode.workspace.fs.readDirectory(currentUri);
    for (const [name, fileType] of entries) {
      if (name.startsWith(".")) {
        continue;
      }
      const childUri = vscode.Uri.joinPath(currentUri, name);
      if (fileType === vscode.FileType.Directory) {
        await walk(childUri);
        continue;
      }
      if (fileType === vscode.FileType.File && name.toLowerCase().endsWith(".md")) {
        results.push(childUri);
      }
    }
  }
  await walk(rootUri);
  return results;
}

// src/utils/sorting.ts
function sortItems(left, right) {
  const leftRank = getItemSortRank(left);
  const rightRank = getItemSortRank(right);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return left.label.localeCompare(right.label);
}
function getItemSortRank(item) {
  if (item.contextValue === "stageSummary") {
    return -1;
  }
  if (item.type === "directory") {
    const stageOrder = getStageDirectoryOrder(item.resourceUri);
    if (stageOrder !== void 0) {
      return stageOrder;
    }
    return 10;
  }
  return 20;
}
function getStageDirectoryOrder(resourceUri) {
  if (!resourceUri) {
    return void 0;
  }
  const name = resourceUri.path.split("/").pop().toLowerCase();
  if (name === "inception") {
    return 0;
  }
  if (name === "construction") {
    return 1;
  }
  if (name === "operations") {
    return 2;
  }
  return void 0;
}

// src/utils/visualState.ts
function getFileVisualState(resourceUri, openedFiles, knownFiles, newFiles) {
  const key = resourceUri.toString();
  if (newFiles.has(key)) {
    return "new";
  }
  if (openedFiles.has(key)) {
    return "read";
  }
  return "known";
}
function getDirectoryVisualState(resourceUri, openedFiles, knownFiles, newFiles) {
  const prefix = ensureTrailingSlash(resourceUri.toString());
  let newCount = 0;
  let readCount = 0;
  for (const key of knownFiles) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    if (newFiles.has(key)) {
      newCount += 1;
    } else if (openedFiles.has(key)) {
      readCount += 1;
    }
  }
  return {
    hasNew: newCount > 0,
    newCount,
    readCount
  };
}

// src/utils/icons.ts
var vscode2 = __toESM(require("vscode"));
function getDirectoryIconName(resourceUri) {
  const name = resourceUri.path.split("/").pop().toLowerCase();
  if (name === "common") {
    return "library";
  }
  if (name === "inception") {
    return "compass";
  }
  if (name === "construction") {
    return "tools";
  }
  if (name === "operations") {
    return "pulse";
  }
  if (name === "extensions") {
    return "extensions";
  }
  return "folder";
}
function getDirectoryColor(resourceUri, visualState) {
  const stage = detectStageFromPath(`${resourceUri.path}/placeholder.md`);
  if (stage) {
    return getStageColor(stage);
  }
  if (visualState.hasNew) {
    return new vscode2.ThemeColor("charts.green");
  }
  return void 0;
}
function getStageIcon(stage) {
  if (stage === "inception") {
    return "compass";
  }
  if (stage === "construction") {
    return "tools";
  }
  if (stage === "operations") {
    return "pulse";
  }
  return "question";
}
function getStageColor(stage) {
  if (stage === "inception") {
    return new vscode2.ThemeColor("charts.blue");
  }
  if (stage === "construction") {
    return new vscode2.ThemeColor("charts.orange");
  }
  if (stage === "operations") {
    return new vscode2.ThemeColor("charts.green");
  }
  return void 0;
}

// src/provider/treeDataProvider.ts
var MarkdownTreeDataProvider = class {
  rootUri;
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  metadataCache = /* @__PURE__ */ new Map();
  directoryStatsCache = /* @__PURE__ */ new Map();
  stageSummaryCache = /* @__PURE__ */ new Map();
  openedFiles = /* @__PURE__ */ new Set();
  knownFiles = /* @__PURE__ */ new Set();
  newFiles = /* @__PURE__ */ new Set();
  setFileState(openedFiles, knownFiles, newFiles) {
    this.openedFiles = new Set(openedFiles);
    this.knownFiles = new Set(knownFiles);
    this.newFiles = new Set(newFiles);
    this.refresh();
  }
  setRootUri(rootUri) {
    this.rootUri = rootUri;
    this.refresh();
  }
  refresh() {
    this.metadataCache.clear();
    this.directoryStatsCache.clear();
    this.stageSummaryCache.clear();
    this._onDidChangeTreeData.fire(void 0);
  }
  getTreeItem(element) {
    return element;
  }
  async getChildren(element) {
    if (!this.rootUri) {
      return [
        new InfoItem("Select a folder to start watching", 'Run "Markdown Watch Viewer: Select Folder".')
      ];
    }
    if (!element) {
      const stageSummary = await this.getStageSummary(this.rootUri);
      const entries = await this.getDirectoryEntries(this.rootUri);
      return [new StageItem(stageSummary), ...entries];
    }
    return this.getDirectoryEntries(element.resourceUri);
  }
  async getDirectoryEntries(targetUri) {
    const entries = await vscode3.workspace.fs.readDirectory(targetUri);
    const rawItems = await Promise.all(
      entries.filter(([name]) => !name.startsWith(".")).map(async ([name, fileType]) => {
        const childUri = vscode3.Uri.joinPath(targetUri, name);
        const isDirectory = fileType === vscode3.FileType.Directory;
        if (isDirectory) {
          const stats = await this.getDirectoryStats(childUri);
          if (!stats.hasMarkdown) {
            return void 0;
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
  async getStageSummary(rootUri) {
    const cacheKey = rootUri.toString();
    if (this.stageSummaryCache.has(cacheKey)) {
      return this.stageSummaryCache.get(cacheKey);
    }
    const markdownFiles = await collectMarkdownFiles(rootUri);
    const counts = {
      inception: 0,
      construction: 0,
      operations: 0
    };
    let latest;
    for (const fileUri of markdownFiles) {
      const stage = detectStageFromPath2(fileUri.fsPath);
      if (!stage) {
        continue;
      }
      counts[stage] += 1;
      try {
        const stat = await vscode3.workspace.fs.stat(fileUri);
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
    const summary = {
      currentStage,
      counts,
      latestFile: latest?.fileUri,
      latestModifiedLabel: latest?.fileUri ? vscode3.workspace.asRelativePath(latest.fileUri) : void 0
    };
    this.stageSummaryCache.set(cacheKey, summary);
    return summary;
  }
  async getMarkdownMetadata(resourceUri) {
    if (!resourceUri.fsPath.toLowerCase().endsWith(".md")) {
      return void 0;
    }
    const cacheKey = resourceUri.toString();
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey);
    }
    try {
      const bytes = await vscode3.workspace.fs.readFile(resourceUri);
      const content = Buffer.from(bytes).toString("utf8");
      const lines = content.split(/\r?\n/);
      const heading = lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim();
      const summary = lines.find((line) => line.trim() && !line.startsWith("#") && !line.startsWith("```"))?.trim();
      const metadata = { heading, summary };
      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch {
      const metadata = { heading: void 0, summary: void 0 };
      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    }
  }
  async getDirectoryStats(resourceUri) {
    const cacheKey = resourceUri.toString();
    if (this.directoryStatsCache.has(cacheKey)) {
      return this.directoryStatsCache.get(cacheKey);
    }
    try {
      const entries = await vscode3.workspace.fs.readDirectory(resourceUri);
      let markdownCount = 0;
      let childDirectoryCount = 0;
      let hasMarkdown = false;
      for (const [name, fileType] of entries) {
        if (name.startsWith(".")) {
          continue;
        }
        const childUri = vscode3.Uri.joinPath(resourceUri, name);
        if (fileType === vscode3.FileType.File && name.toLowerCase().endsWith(".md")) {
          markdownCount += 1;
          hasMarkdown = true;
          continue;
        }
        if (fileType === vscode3.FileType.Directory) {
          const childStats = await this.getDirectoryStats(childUri);
          if (childStats.hasMarkdown) {
            hasMarkdown = true;
            childDirectoryCount += 1;
          }
        }
      }
      const stats = { hasMarkdown, markdownCount, childDirectoryCount };
      this.directoryStatsCache.set(cacheKey, stats);
      return stats;
    } catch {
      const stats = { hasMarkdown: false, markdownCount: 0, childDirectoryCount: 0 };
      this.directoryStatsCache.set(cacheKey, stats);
      return stats;
    }
  }
};
var InfoItem = class extends vscode3.TreeItem {
  constructor(label, description) {
    super(label, vscode3.TreeItemCollapsibleState.None);
    this.description = description;
    this.contextValue = "info";
  }
};
var StageItem = class extends vscode3.TreeItem {
  constructor(summary) {
    super(formatStageLabel(summary), vscode3.TreeItemCollapsibleState.None);
    this.description = formatStageDescription(summary);
    this.tooltip = buildStageTooltip(summary);
    this.contextValue = "stageSummary";
    this.iconPath = new vscode3.ThemeIcon(getStageIcon(summary.currentStage), getStageColor(summary.currentStage));
  }
};
var DirectoryItem = class extends vscode3.TreeItem {
  constructor(resourceUri, stats, visualState) {
    super(vscode3.workspace.asRelativePath(resourceUri), vscode3.TreeItemCollapsibleState.Collapsed);
    this.resourceUri = resourceUri;
    this.type = "directory";
    this.contextValue = "directory";
    this.description = formatDirectoryDescription(stats, visualState);
    this.tooltip = buildDirectoryTooltip(resourceUri, stats, visualState);
    this.iconPath = new vscode3.ThemeIcon(
      getDirectoryIconName(resourceUri),
      getDirectoryColor(resourceUri, visualState)
    );
  }
};
var MarkdownFileItem = class extends vscode3.TreeItem {
  constructor(resourceUri, metadata, visualState) {
    super(vscode3.workspace.asRelativePath(resourceUri), vscode3.TreeItemCollapsibleState.None);
    this.resourceUri = resourceUri;
    this.type = "file";
    this.contextValue = "markdownFile";
    this.description = formatFileDescription(metadata, visualState);
    this.tooltip = buildFileTooltip(resourceUri, metadata, visualState);
    this.iconPath = new vscode3.ThemeIcon(
      visualState === "new" ? "circle-filled" : visualState === "read" ? "pass-filled" : "file",
      visualState === "new" ? new vscode3.ThemeColor("charts.green") : visualState === "read" ? new vscode3.ThemeColor("disabledForeground") : void 0
    );
    this.command = {
      command: "markdownWatchViewer.openFile",
      title: "Open Markdown File",
      arguments: [this]
    };
  }
};
var OtherFileItem = class extends vscode3.TreeItem {
  constructor(resourceUri) {
    super(vscode3.workspace.asRelativePath(resourceUri), vscode3.TreeItemCollapsibleState.None);
    this.resourceUri = resourceUri;
    this.type = "file";
    this.contextValue = "file";
    this.description = vscode3.workspace.asRelativePath(resourceUri, true);
  }
};
function createFileItem(resourceUri, fileType, metadata, visualState) {
  if (fileType !== vscode3.FileType.File) {
    return void 0;
  }
  if (resourceUri.fsPath.toLowerCase().endsWith(".md")) {
    return new MarkdownFileItem(resourceUri, metadata, visualState);
  }
  return new OtherFileItem(resourceUri);
}

// src/webview/template.ts
function getWebviewHtml(webview, fileUri, markdown) {
  const safeInitialValue = JSON.stringify(markdown);
  const title = escapeHtml(fileUri.fsPath);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: var(--vscode-editor-background);
        --panel: var(--vscode-sideBar-background);
        --border: var(--vscode-panel-border);
        --text: var(--vscode-editor-foreground);
        --muted: var(--vscode-descriptionForeground);
        --accent: var(--vscode-button-background);
        --accent-text: var(--vscode-button-foreground);
      }

      body {
        margin: 0;
        color: var(--text);
        background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 92%, #8fb8ff 8%), var(--bg));
        font-family: var(--vscode-font-family);
      }

      .shell {
        display: grid;
        grid-template-columns: 3fr 7fr;
        height: 100vh;
      }

      .pane {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .pane + .pane {
        border-left: 1px solid var(--border);
      }

      .header {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
        background: color-mix(in srgb, var(--panel) 88%, transparent);
      }

      .title {
        font-size: 12px;
        color: var(--muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-2px);
        transition: opacity 140ms ease, transform 140ms ease;
      }

      .actions.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      button {
        border: 0;
        padding: 7px 12px;
        border-radius: 8px;
        background: var(--accent);
        color: var(--accent-text);
        cursor: pointer;
      }

      button.secondary {
        background: transparent;
        color: var(--text);
        border: 1px solid var(--border);
      }

      textarea {
        flex: 1;
        width: 100%;
        resize: none;
        border: 0;
        outline: none;
        padding: 16px;
        box-sizing: border-box;
        color: var(--text);
        background: transparent;
        font: 13px/1.6 var(--vscode-editor-font-family);
      }

      .preview {
        overflow: auto;
        padding: 20px;
        line-height: 1.65;
      }

      .preview h1,
      .preview h2,
      .preview h3 {
        line-height: 1.2;
      }

      .preview pre {
        overflow: auto;
        padding: 12px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--panel) 78%, transparent);
      }

      .preview code {
        font-family: var(--vscode-editor-font-family);
      }

      .preview blockquote {
        margin: 0;
        padding-left: 12px;
        border-left: 3px solid color-mix(in srgb, var(--accent) 55%, var(--border));
        color: var(--muted);
      }

      .status {
        font-size: 12px;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="pane">
        <div class="header">
          <div class="title">${title}</div>
          <div class="actions">
            <button class="secondary" id="reload">Reload</button>
            <button id="save">Save</button>
          </div>
        </div>
        <textarea id="editor" spellcheck="false"></textarea>
      </section>
      <section class="pane">
        <div class="header">
          <div class="title">Preview</div>
          <div class="status" id="status">Ready</div>
        </div>
        <div id="preview" class="preview"></div>
      </section>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const initialValue = ${safeInitialValue};
      const editor = document.getElementById('editor');
      const preview = document.getElementById('preview');
      const status = document.getElementById('status');
      const actions = document.querySelector('.actions');
      let cleanValue = initialValue;

      editor.value = initialValue;
      renderMarkdown(initialValue);
      syncActionVisibility();

      editor.addEventListener('input', () => {
        renderMarkdown(editor.value);
        status.textContent = isDirty() ? 'Unsaved changes' : 'Ready';
        syncActionVisibility();
      });

      document.getElementById('save').addEventListener('click', () => {
        vscode.postMessage({
          type: 'save',
          content: editor.value
        });
        cleanValue = editor.value;
        status.textContent = 'Saved';
        syncActionVisibility(false);
      });

      document.getElementById('reload').addEventListener('click', () => {
        vscode.postMessage({ type: 'requestLatest' });
        cleanValue = initialValue;
        status.textContent = 'Ready';
        syncActionVisibility(false);
      });

      function renderMarkdown(source: string) {
        preview.innerHTML = markdownToHtml(source);
      }

      function isDirty(): boolean {
        return editor.value !== cleanValue;
      }

      function syncActionVisibility(forceVisible: boolean = isDirty()) {
        actions.classList.toggle('visible', forceVisible);
      }
    </script>
  </body>
</html>`;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/controller/watchController.ts
var STATE_KEY = "markdownWatchViewer.watchedFolder";
var OPENED_KEY = "markdownWatchViewer.openedFiles";
var KNOWN_KEY = "markdownWatchViewer.knownFiles";
var NEW_KEY = "markdownWatchViewer.newFiles";
var WatchController = class {
  context;
  treeDataProvider;
  fileWatcher;
  previewPanels;
  openedFiles;
  knownFiles;
  newFiles;
  constructor(context) {
    this.context = context;
    this.treeDataProvider = new MarkdownTreeDataProvider();
    this.previewPanels = /* @__PURE__ */ new Map();
    this.openedFiles = new Set(context.workspaceState.get(OPENED_KEY, []));
    this.knownFiles = new Set(context.workspaceState.get(KNOWN_KEY, []));
    this.newFiles = new Set(context.workspaceState.get(NEW_KEY, []));
    this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
  }
  async restoreWatcher() {
    const storedFolder = this.context.workspaceState.get(STATE_KEY);
    if (!storedFolder) {
      this.treeDataProvider.setRootUri(void 0);
      return;
    }
    const uri = vscode4.Uri.file(storedFolder);
    try {
      await vscode4.workspace.fs.stat(uri);
      await this.setWatchedFolder(uri, { showMessage: false });
    } catch {
      this.context.workspaceState.update(STATE_KEY, void 0);
      this.treeDataProvider.setRootUri(void 0);
      vscode4.window.showWarningMessage("Previously watched folder was not found. Please select a new one.");
    }
  }
  async selectFolder() {
    const selection = await vscode4.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Watch this folder"
    });
    if (!selection || !selection[0]) {
      return;
    }
    await this.setWatchedFolder(selection[0], { showMessage: true });
  }
  async setWatchedFolder(folderUri, options = { showMessage: true }) {
    this.disposeWatcher();
    this.treeDataProvider.setRootUri(folderUri);
    await this.context.workspaceState.update(STATE_KEY, folderUri.fsPath);
    await this.primeKnownFiles(folderUri);
    const pattern = new vscode4.RelativePattern(folderUri, "**/*");
    this.fileWatcher = vscode4.workspace.createFileSystemWatcher(pattern);
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
      vscode4.window.showInformationMessage(`Watching folder: ${folderUri.fsPath}`);
    }
    this.refresh();
  }
  refresh() {
    this.treeDataProvider.refresh();
  }
  async openFile(item) {
    if (!item || item.type !== "file") {
      return;
    }
    await this.markFileOpened(item.resourceUri);
    const key = item.resourceUri.toString();
    let panel = this.previewPanels.get(key);
    if (panel) {
      panel.reveal(vscode4.ViewColumn.One);
      await this.updatePreview(panel, item.resourceUri);
      return;
    }
    panel = vscode4.window.createWebviewPanel(
      "markdownWatchViewer.editor",
      vscode4.workspace.asRelativePath(item.resourceUri),
      vscode4.ViewColumn.One,
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
      if (message.type === "save") {
        await this.saveMarkdown(item.resourceUri, message.content);
        return;
      }
      if (message.type === "requestLatest") {
        await this.updatePreview(panel, item.resourceUri);
      }
    });
    await this.updatePreview(panel, item.resourceUri);
  }
  async updatePreview(panel, fileUri) {
    const bytes = await vscode4.workspace.fs.readFile(fileUri);
    const content = Buffer.from(bytes).toString("utf8");
    panel.title = vscode4.workspace.asRelativePath(fileUri);
    panel.webview.html = getWebviewHtml(panel.webview, fileUri, content);
  }
  async saveMarkdown(fileUri, content) {
    await vscode4.workspace.fs.writeFile(fileUri, Buffer.from(content, "utf8"));
    vscode4.window.showInformationMessage(`Saved ${vscode4.workspace.asRelativePath(fileUri)}`);
    this.refresh();
  }
  async notifyOpenPreview(uri) {
    const panel = this.previewPanels.get(uri.toString());
    if (!panel) {
      return;
    }
    await this.updatePreview(panel, uri);
  }
  disposeWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = void 0;
    }
  }
  async handleCreate(uri) {
    try {
      const stat = await vscode4.workspace.fs.stat(uri);
      if (stat.type === vscode4.FileType.File && uri.fsPath.toLowerCase().endsWith(".md")) {
        this.knownFiles.add(uri.toString());
        this.newFiles.add(uri.toString());
        this.treeDataProvider.setFileState(this.openedFiles, this.knownFiles, this.newFiles);
        await this.context.workspaceState.update(KNOWN_KEY, [...this.knownFiles]);
        await this.context.workspaceState.update(NEW_KEY, [...this.newFiles]);
        return;
      }
      if (stat.type === vscode4.FileType.Directory) {
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
  async markFileOpened(fileUri) {
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
  async primeKnownFiles(folderUri) {
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
};

// src/extension.ts
function activate(context) {
  const controller = new WatchController(context);
  context.subscriptions.push(
    vscode5.window.registerTreeDataProvider("markdownWatchViewer.tree", controller.treeDataProvider),
    vscode5.commands.registerCommand("markdownWatchViewer.selectFolder", () => controller.selectFolder()),
    vscode5.commands.registerCommand("markdownWatchViewer.refresh", () => controller.refresh()),
    vscode5.commands.registerCommand("markdownWatchViewer.openFile", (item) => controller.openFile(item))
  );
  controller.restoreWatcher();
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
