import { WatchController } from './controller/watchController';
import { commands, Disposable, ExtensionContext, window } from 'vscode';

class MarkdownWatchViewerExtension implements Disposable {
  private readonly controller: WatchController;
  private readonly disposables: Disposable[] = [];
  private _isDisposed = false;

  constructor(private readonly context: ExtensionContext) {
    this.controller = new WatchController(context);
  }

  activate(): void {
    this.disposables.push(
      window.registerTreeDataProvider(
        'markdownWatchViewer.tree',
        this.controller.treeDataProvider
      ),
      commands.registerCommand('markdownWatchViewer.selectFolder', () =>
        this.controller.selectFolder()
      ),
      commands.registerCommand('markdownWatchViewer.refresh', () =>
        this.controller.refresh()
      ),
      commands.registerCommand('markdownWatchViewer.openFile', (item) =>
        this.controller.openFile(item)
      )
    );
    this.controller.restoreWatcher();
  }

  dispose(): void {
    if (this._isDisposed) { return };
    this._isDisposed = true;
    this.controller.dispose();
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables.length = 0;
  }
}

export function activate(context: ExtensionContext) {
  const extension = new MarkdownWatchViewerExtension(context);
  extension.activate();
  context.subscriptions.push(extension);
}
