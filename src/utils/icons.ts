import * as vscode from 'vscode';
import { Stage } from '../model/stage';

export function getDirectoryIconName(resourceUri: vscode.Uri): string {
  const name = resourceUri.path.split('/').pop()!.toLowerCase();
  if (name === 'common') {
    return 'library';
  }
  if (name === 'inception') {
    return 'compass';
  }
  if (name === 'construction') {
    return 'tools';
  }
  if (name === 'operations') {
    return 'pulse';
  }
  if (name === 'extensions') {
    return 'extensions';
  }
  return 'folder';
}

export function getDirectorySectionHint(resourceUri: vscode.Uri): string | undefined {
  const name = resourceUri.path.split('/').pop()!.toLowerCase();
  if (name === 'common') {
    return 'Shared workflow rules and standards';
  }
  if (name === 'inception') {
    return 'Planning and analysis stage rules';
  }
  if (name === 'construction') {
    return 'Implementation and build stage rules';
  }
  if (name === 'operations') {
    return 'Operations stage rules';
  }
  if (name === 'extensions') {
    return 'Optional extension rule packs';
  }
  return undefined;
}

export function getDirectoryColor(resourceUri: vscode.Uri, visualState: { hasNew: boolean; newCount: number; readCount: number }): vscode.ThemeColor | undefined {
  const stage = detectStageFromPath(`${resourceUri.path}/placeholder.md`);
  if (stage) {
    return getStageColor(stage);
  }

  if (visualState.hasNew) {
    return new vscode.ThemeColor('charts.green');
  }

  return undefined;
}

export function getStageIcon(stage: Stage): string {
  if (stage === 'inception') {
    return 'compass';
  }
  if (stage === 'construction') {
    return 'tools';
  }
  if (stage === 'operations') {
    return 'pulse';
  }
  return 'question';
}

export function getStageColor(stage: Stage): vscode.ThemeColor | undefined {
  if (stage === 'inception') {
    return new vscode.ThemeColor('charts.blue');
  }
  if (stage === 'construction') {
    return new vscode.ThemeColor('charts.orange');
  }
  if (stage === 'operations') {
    return new vscode.ThemeColor('charts.green');
  }
  return undefined;
}
