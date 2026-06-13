#!/usr/bin/env node
/**
 * Build script for the extension.
 * Can be executed directly with Node's TypeScript support:
 *   node --loader ts-node/esm scripts/build.ts
 * or via ts-node:
 *   npx ts-node scripts/build.ts
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure esbuild context
const ctx = await esbuild.context({
  entryPoints: [join(__dirname, '../src/extension.ts')],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'cjs',
  external: ['vscode'],
  outfile: join(__dirname, '../dist/extension.js'),
  sourcemap: true,
  logLevel: 'info',
});

if (process.argv.includes('--watch')) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
