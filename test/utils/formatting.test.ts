import { describe, it, assert } from 'poku';
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
      assert.equal(formatStageLabel(summary), 'Current Stage: Inception');
    });

    it('should handle unknown stage', () => {
      const summary = {
        currentStage: 'unknown',
        counts: { inception: 0, construction: 0, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      assert.equal(formatStageLabel(summary), 'Current Stage: Unknown');
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
      assert.equal(formatStageDescription(summary), 'I 2 • C 1');
    });

    it('should handle empty counts', () => {
      const summary = {
        currentStage: 'inception',
        counts: { inception: 0, construction: 0, operations: 0 },
        latestFile: undefined,
        latestModifiedLabel: undefined
      };
      assert.equal(formatStageDescription(summary), 'No stage files detected');
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
       assert.equal(formatDirectoryDescription(stats, visualState), '1 read • 3 md • 2 dirs');
    });

    it('should handle new files', () => {
      const stats = {
        hasMarkdown: true,
        markdownCount: 2,
        childDirectoryCount: 0
      };
      const visualState = { hasNew: true, newCount: 1, readCount: 0 };
      assert.equal(formatDirectoryDescription(stats, visualState), 'new • 2 md');
    });
  });

  describe('formatFileDescription', () => {
    it('should format file description correctly', () => {
      const metadata = { heading: 'Requirements Analysis', summary: '...' };
      assert.equal(formatFileDescription(metadata, 'known'), 'Requirements Analysis');
    });

    it('should handle new files', () => {
      const metadata = { heading: 'New Task', summary: undefined };
      assert.equal(formatFileDescription(metadata, 'new'), 'NEW • New Task');
    });

    it('should handle read files', () => {
      const metadata = { heading: 'Read File', summary: undefined };
      assert.equal(formatFileDescription(metadata, 'read'), 'READ • Read File');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      assert.equal(capitalize('inception'), 'Inception');
    });

    it('should handle undefined', () => {
      assert.equal(capitalize(undefined), '');
    });

    it('should handle empty string', () => {
      assert.equal(capitalize(''), '');
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
      assert.ok(tooltip.includes('Detected stage: Inception'));
      assert.ok(tooltip.includes('Inception files: 2'));
      assert.ok(tooltip.includes('Construction files: 1'));
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
      assert.ok(tooltip.includes('/test'));
      assert.ok(tooltip.includes('New markdown files below: 1'));
    });
  });

  describe('buildFileTooltip', () => {
    it('should build file tooltip correctly', () => {
      const metadata = { heading: 'Requirements Analysis', summary: '...' };
      const tooltip = buildFileTooltip(vscode.Uri.parse('/test/file.md'), metadata, 'known');
      assert.ok(tooltip.includes('/test/file.md'));
      assert.ok(tooltip.includes('Existing file in watched folder'));
      assert.ok(tooltip.includes('Requirements Analysis'));
    });
  });
});
