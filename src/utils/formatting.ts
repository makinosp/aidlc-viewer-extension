import * as vscode from 'vscode';
import { StageSummary, DirectoryStats, FileState, MarkdownMetadata } from '../types';

export function formatStageLabel(summary: StageSummary): string {
  if (summary.currentStage === 'unknown') {
    return 'Current Stage: Unknown';
  }

  return `Current Stage: ${capitalize(summary.currentStage)}`;
}

export function formatStageDescription(summary: StageSummary): string {
  const parts: string[] = [];
  if (summary.counts.inception > 0) {
    parts.push(`I ${summary.counts.inception}`);
  }
  if (summary.counts.construction > 0) {
    parts.push(`C ${summary.counts.construction}`);
  }
  if (summary.counts.operations > 0) {
    parts.push(`O ${summary.counts.operations}`);
  }
  return parts.join(' • ') || 'No stage files detected';
}

export function formatDirectoryDescription(stats: DirectoryStats, visualState: { hasNew: boolean; newCount: number; readCount: number }): string {
  const parts: string[] = [];
  if (visualState.newCount > 0) {
    parts.push(`${visualState.newCount} new`);
  }
  if (visualState.readCount > 0) {
    parts.push(`${visualState.readCount} read`);
  }
  if (stats.markdownCount > 0) {
    parts.push(`${stats.markdownCount} md`);
  }
  if (stats.childDirectoryCount > 0) {
    parts.push(`${stats.childDirectoryCount} dirs`);
  }
  return parts.join(' • ');
}

export function formatFileDescription(metadata: MarkdownMetadata | undefined, visualState: FileState): string {
  const stateLabel = visualState === 'new' ? 'NEW' : visualState === 'read' ? 'READ' : undefined;
  return [stateLabel, metadata?.heading].filter(Boolean).join(' • ');
}

export function capitalize(value: string | undefined): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value || '';
}

export function buildStageTooltip(summary: StageSummary): string {
  return [
    `Detected stage: ${summary.currentStage === 'unknown' ? 'unknown' : capitalize(summary.currentStage)}`,
    `Inception files: ${summary.counts.inception}`,
    `Construction files: ${summary.counts.construction}`,
    `Operations files: ${summary.counts.operations}`,
    summary.latestFile ? `Latest stage file: ${summary.latestFile.fsPath}` : 'No stage file detected yet'
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDirectoryTooltip(resourceUri: vscode.Uri, stats: DirectoryStats, visualState: { hasNew: boolean; newCount: number; readCount: number }): string {
  const sectionHint = getDirectorySectionHint(resourceUri);
  return [
    resourceUri.fsPath,
    sectionHint,
    visualState.newCount > 0 ? `New markdown files below: ${visualState.newCount}` : 'No new markdown files',
    visualState.readCount > 0 ? `Read markdown files below: ${visualState.readCount}` : undefined,
    `Markdown files here: ${stats.markdownCount}`,
    `Child folders with markdown: ${stats.childDirectoryCount}`
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildFileTooltip(resourceUri: vscode.Uri, metadata: MarkdownMetadata | undefined, visualState: FileState): string {
  return [
    resourceUri.fsPath,
    visualState === 'new' ? 'New file since watching started' : visualState === 'read' ? 'Opened in the viewer' : 'Existing file in watched folder',
    metadata?.heading,
    metadata?.summary
  ]
    .filter(Boolean)
    .join('\n');
}
