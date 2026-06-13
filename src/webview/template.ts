import * as vscode from 'vscode';
import { markdownToHtml } from './markdownParser';

export function getWebviewHtml(webview: vscode.Webview, fileUri: vscode.Uri, markdown: string): string {
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
