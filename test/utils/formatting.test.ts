import { describe, it, expect } from 'poku';
import {
  formatStageLabel,
  formatStageDescription,
  formatDirectoryDescription,
  formatFileDescription,
  capitalize,
  buildStageTooltip,
  buildDirectoryTooltip,
  buildFileTooltip
} from '../../src/utils/formatting';

describe('formatting utilities', () => {
  describe('formatStageLabel', () => {
    it('should format stage label correctly', () => {
      const summary = {
        currentStage: 'inception',
        counts: { inception: 1, construction: 0, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      expect(formatStageLabel(summary)).toBe('Current Stage: Inception');
    });

    it('should handle unknown stage', () => {
      const summary = {
        currentStage: 'unknown',
        counts: { inception: 0, construction: 0, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      expect(formatStageLabel(summary)).toBe('Current Stage: Unknown');
    });
  });

  describe('formatStageDescription', () => {
    it('should format stage description correctly', () => {
      const summary = {
        currentStage: 'inception',
        counts: { inception: 2, construction: 1, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      expect(formatStageDescription(summary)).toBe('I 2 • C 1');
    });

    it('should handle empty counts', () => {
      const summary = {
        currentStage: 'inception',
        counts: { inception: 0, construction: 0, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      expect(formatStageDescription(summary)).toBe('No stage files detected');
    });
  });

  describe('formatDirectoryDescription', () => {
    it('should format directory description correctly', () => {
      const stats = {
        hasMarkdown: true,
        markdownCount: 3,
        childDirectoryCount: 2
      };
      const visualState = { hasNew: false, newCount: 0, readCount: 1 };
      expect(formatDirectoryDescription(stats, visualState)).toBe('read • 3 md • 2 dirs');
    });

    it('should handle new files', () => {
      const stats = {
        hasMarkdown: true,
        markdownCount: 2,
        childDirectoryCount: 0
      };
      const visualState = { hasNew: true, newCount: 1, readCount: 0 };
      expect(formatDirectoryDescription(stats, visualState)).toBe('new • 2 md');
    });
  });

  describe('formatFileDescription', () => {
    it('should format file description correctly', () => {
      const metadata = { heading: 'Requirements Analysis', summary: '...' };
      expect(formatFileDescription(metadata, 'known')).toBe('Requirements Analysis');
    });

    it('should handle new files', () => {
      const metadata = { heading: 'New Task', summary: undefined };
      expect(formatFileDescription(metadata, 'new')).toBe('NEW • New Task');
    });

    it('should handle read files', () => {
      const metadata = { heading: 'Read File', summary: undefined };
      expect(formatFileDescription(metadata, 'read')).toBe('READ • Read File');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('inception')).toBe('Inception');
    });

    it('should handle undefined', () => {
      expect(capitalize(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('buildStageTooltip', () => {
    it('should build stage tooltip correctly', () => {
      const summary = {
        currentStage: 'inception',
        counts: { inception: 2, construction: 1, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      const tooltip = buildStageTooltip(summary);
      expect(tooltip).toContain('Detected stage: Inception');
      expect(tooltip).toContain('Inception files: 2');
      expect(tooltip).toContain('Construction files: 1');
    });
  });

  describe('buildDirectoryTooltip', () => {
    it('should build directory tooltip correctly', () => {
      const stats = {
        hasMarkdown: true,
        markdownCount: 3,
        childDirectoryCount: 2
      };
      const visualState = { hasNew: true, newCount: 1, readCount: 0 };
      const tooltip = buildDirectoryTooltip(vscode.Uri.parse('/test'), stats, visualState);
      expect(tooltip).toContain('/test');
      expect(tooltip).toContain('New markdown files below: 1');
    });
  });

  describe('buildFileTooltip', () => {
    it('should build file tooltip correctly', () => {
      const metadata = { heading: 'Requirements Analysis', summary: '...' };
      const tooltip = buildFileTooltip(vscode.Uri.parse('/test/file.md'), metadata, 'known');
      expect(tooltip).toContain('/test/file.md');
      expect(tooltip).toContain('Existing file in watched folder');
      expect(tooltip).toContain('Requirements Analysis');
    });
  });
});
