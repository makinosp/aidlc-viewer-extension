import * as vscode from 'vscode';
import { TreeItem } from '../types';

export function sortItems(left: TreeItem, right: TreeItem): number {
  const leftRank = getItemSortRank(left);
  const rightRank = getItemSortRank(right);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.label.localeCompare(right.label);
}

export function getItemSortRank(item: TreeItem): number {
  if (item.contextValue === 'stageSummary') {
    return -1;
  }

  if (item.type === 'directory') {
    const stageOrder = getStageDirectoryOrder(item.resourceUri);
    if (stageOrder !== undefined) {
      return stageOrder;
    }
    return 10;
  }

  return 20;
}

function getStageDirectoryOrder(resourceUri: vscode.Uri | undefined): number | undefined {
  if (!resourceUri) {
    return undefined;
  }

  const name = resourceUri.path.split('/').pop()!.toLowerCase();
  if (name === 'inception') {
    return 0;
  }
  if (name === 'construction') {
    return 1;
  }
  if (name === 'operations') {
    return 2;
  }
  return undefined;
}
