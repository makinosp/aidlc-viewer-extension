export interface WebviewMessage {
  type: 'save' | 'requestLatest';
  content?: string;
}
