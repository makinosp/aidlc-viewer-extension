import { WebviewMessage } from './types';

export function initializeWebview(webview: vscode.WebviewPanel) {
  const editor = document.getElementById('editor') as HTMLTextAreaElement;
  const preview = document.getElementById('preview') as HTMLDivElement;
  const status = document.getElementById('status') as HTMLDivElement;
  const actions = document.querySelector('.actions') as HTMLElement;
  let cleanValue: string;

  editor.addEventListener('input', () => {
    renderMarkdown(editor.value);
    status.textContent = isDirty() ? 'Unsaved changes' : 'Ready';
    syncActionVisibility();
  });

  document.getElementById('save')?.addEventListener('click', () => {
    webview.postMessage({
      type: 'save',
      content: editor.value
    } as WebviewMessage);
    cleanValue = editor.value;
    status.textContent = 'Saved';
    syncActionVisibility(false);
  });

  document.getElementById('reload')?.addEventListener('click', () => {
    webview.postMessage({ type: 'requestLatest' } as WebviewMessage);
    cleanValue = editor.value;
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
}

function markdownToHtml(source: string): string {
  let html = escapeHtml(source);

  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/^(?!<h\d|<ul>|<li>|<pre>|<blockquote>)([^\n<].+)$/gm, '<p>$1</p>');
  return html;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
