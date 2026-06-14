import * as vscode from 'vscode';
import { WatchController } from './controller/watchController';

const STATE_KEY = 'markdownWatchViewer.watchedFolder';
const OPENED_KEY = 'markdownWatchViewer.openedFiles';
const KNOWN_KEY = 'markdownWatchViewer.knownFiles';
const NEW_KEY = 'markdownWatchViewer.newFiles';

export function activate(context: vscode.ExtensionContext) {
  const controller = new WatchController(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('markdownWatchViewer.tree', controller.treeDataProvider),
    vscode.commands.registerCommand('markdownWatchViewer.selectFolder', () => controller.selectFolder()),
    vscode.commands.registerCommand('markdownWatchViewer.refresh', () => controller.refresh()),
    vscode.commands.registerCommand('markdownWatchViewer.openFile', (item) => controller.openFile(item))
  );

  controller.restoreWatcher();
}

export function deactivate() {
  controller.dispose();
}
