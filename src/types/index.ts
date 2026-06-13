export type FileState = 'new' | 'read' | 'known';

export type Stage = 'inception' | 'construction' | 'operations';

export interface MarkdownMetadata {
  heading: string;
  summary: string;
}

export interface DirectoryStats {
  markdownCount: number;
  subDirs: number;
}

export interface StageSummary {
  stage: Stage;
  counts: Record<Stage, number>;
}

export interface TreeItem {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  iconPath?: string;
  contextValue?: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  sortRank: number;
}

export interface WatchedFolder {
  uri: vscode.Uri;
  path: string;
}
