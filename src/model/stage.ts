import * as vscode from 'vscode';

export type Stage = 'inception' | 'construction' | 'operations' | 'unknown';

export function detectStageFromPath(filePath: string): Stage | undefined {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('/operations/')) {
    return 'operations';
  }
  if (normalized.includes('/construction/')) {
    return 'construction';
  }
  if (normalized.includes('/inception/')) {
    return 'inception';
  }
  return undefined;
}

export function inferStageFromCounts(counts: { inception: number; construction: number; operations: number }): Stage {
  if (counts.operations > 0) {
    return 'operations';
  }
  if (counts.construction > 0) {
    return 'construction';
  }
  if (counts.inception > 0) {
    return 'inception';
  }
  return 'unknown';
}
