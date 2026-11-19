import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Static Rule Linter', () => {
  it('should not contain any emojis in src, tasks, or AGENTS.md', () => {
    const rootDir = path.resolve(__dirname, '..');
    const targetFiles: string[] = [
      path.join(rootDir, 'AGENTS.md'),
      ...getFilesRecursively(path.join(rootDir, 'tasks')),
      ...getFilesRecursively(path.join(rootDir, 'src'))
    ];

    const emojiRegex = /\p{Extended_Pictographic}/u;
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of targetFiles) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (emojiRegex.test(line)) {
          violations.push({ file: path.relative(rootDir, file), line: index + 1, text: line.trim() });
        }
      });
    }

    expect(violations, `Found emoji violations:\n${violations.map(v => `${v.file}:${v.line}: ${v.text}`).join('\n')}`).toEqual([]);
  });

  it('should not contain hex colour literals in src outside src/data/palette.ts', () => {
    const rootDir = path.resolve(__dirname, '..');
    const srcDir = path.join(rootDir, 'src');
    const srcFiles = getFilesRecursively(srcDir);
    const paletteFile = path.normalize(path.join(srcDir, 'data', 'palette.ts'));

    const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of srcFiles) {
      if (path.normalize(file) === paletteFile) {
        continue;
      }
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (hexRegex.test(line)) {
          violations.push({ file: path.relative(rootDir, file), line: index + 1, text: line.trim() });
        }
      });
    }

    expect(violations, `Found hex colour violations outside src/data/palette.ts:\n${violations.map(v => `${v.file}:${v.line}: ${v.text}`).join('\n')}`).toEqual([]);
  });
});
