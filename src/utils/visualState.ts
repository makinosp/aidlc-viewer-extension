import * as vscode from 'vscode';
import { FileState } from '../types';

export function getFileVisualState(resourceUri: vscode.Uri, openedFiles: Set<string>, knownFiles: Set<string>, newFiles: Set<string>): FileState {
  const key = resourceUri.toString();
  if (newFiles.has(key)) {
    return 'new';
  }
  if (openedFiles.has(key)) {
    return 'read';
  }
  return 'known';
}

export function getDirectoryVisualState(resourceUri: vscode.Uri, openedFiles: Set<string>, knownFiles: Set<string>, newFiles: Set<string>): { hasNew: boolean; newCount: number; readCount: number } {
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
