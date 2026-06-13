import * as vscode from 'vscode';

export async function collectMarkdownFiles(rootUri: vscode.Uri): Promise<vscode.Uri[]> {
  const results: vscode.Uri[] = [];

  async function walk(currentUri: vscode.Uri) {
    const entries = await vscode.workspace.fs.readDirectory(currentUri);
    for (const [name, fileType] of entries) {
      if (name.startsWith('.')) {
        continue;
      }

      const childUri = vscode.Uri.joinPath(currentUri, name);
      if (fileType === vscode.FileType.Directory) {
        await walk(childUri);
        continue;
      }

      if (fileType === vscode.FileType.File && name.toLowerCase().endsWith('.md')) {
        results.push(childUri);
      }
    }
  }

  await walk(rootUri);
  return results;
}

export function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
