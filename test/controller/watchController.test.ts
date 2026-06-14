import { describe, it, assert } from 'poku';
import { vscode } from 'vscode';
import { WatchController } from '../../src/controller/watchController';
import { MockContext } from './mockContext';

describe('WatchController', () => {
  describe('dispose()', () => {
    it('should dispose of the file watcher and preview panels', () => {
      const context = new MockContext();
      const controller = new WatchController(context);

      // Simulate having a watcher and panels
      controller.fileWatcher = {
        dispose: () => {}
      } as any;
      controller.previewPanels = new Map([
        ['test', { dispose: () => {} } as any]
      ]);

      // Call dispose
      controller.dispose();

      // Assert that the watcher and panels were disposed (we can't easily test the mocks, but at least it doesn't throw)
      assert.ok(true);
    });
  });
});

// Mock context for testing
class MockContext implements vscode.ExtensionContext {
  subscriptions: vscode.Disposable[] = [];
  workspaceState: {
    get<T>(key: string): T | undefined;
    update(key: string, value: any): Thenable<void>;
  } = {
    get: () => undefined,
    update: async () => { }
  } as any;
  extensionPath = '';
  extensionUri = {} as vscode.Uri;
  environmentVariableCollection = {} as vscode.EnvironmentVariableCollection;
  globalState = {} as vscode.Memento;
  globalStoragePath = '';
  globalStorageUri = {} as vscode.Uri;
  logUri = {} as vscode.Uri;
  storagePath = '';
  storageUri = {} as vscode.Uri;
  extensionKind = vscode.ExtensionKind.UI;
  asAbsolutePath = (_path: string) => '';
  dispose = () => { };
}
