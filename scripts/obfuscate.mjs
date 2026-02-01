#!/usr/bin/env node

import { readdir, readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const CHUNKS_DIR = '.next/static/chunks';

// Files to skip obfuscation (framework/runtime files that may break)
const SKIP_PATTERNS = [
  /^webpack/,
  /^framework/,
  /^main-app/,
  /^polyfills/,
  /^turbopack/,
  /^vendor/,        // Skip vendor chunk
  /^react-icons/,   // Skip react-icons chunk
  /^\d+-/,          // Skip numbered vendor chunks (e.g., "123-abc.js")
  /\.map$/,
];

// Minimal obfuscation - variable mangling only, no runtime overhead
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'mangled',  // Shorter names (a, b, c) vs hexadecimal
  ignoreImports: true,                   // Skip import statements
  numbersToExpressions: false,
  renameGlobals: false,
  renameProperties: false,
  selfDefending: false,
  simplify: false,                       // Don't re-simplify (SWC already did)
  splitStrings: false,
  stringArray: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

async function getAllJsFiles(dir) {
  const files = [];

  async function scan(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

function shouldSkip(filename) {
  return SKIP_PATTERNS.some(pattern => pattern.test(filename));
}

async function obfuscateFile(filePath) {
  const filename = filePath.split('/').pop();

  if (shouldSkip(filename)) {
    console.log(`  Skipping: ${filename}`);
    return false;
  }

  try {
    const code = await readFile(filePath, 'utf8');

    // Skip very small files (likely just exports)
    if (code.length < 1000) {
      console.log(`  Skipping (too small): ${filename}`);
      return false;
    }

    const obfuscated = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS);
    await writeFile(filePath, obfuscated.getObfuscatedCode());
    console.log(`  Obfuscated: ${filename}`);
    return true;
  } catch (error) {
    console.error(`  Error obfuscating ${filename}:`, error.message);
    return false;
  }
}

async function deleteSourceMaps(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await deleteSourceMaps(fullPath);
    } else if (entry.name.endsWith('.map')) {
      await rm(fullPath);
      console.log(`  Deleted: ${entry.name}`);
    }
  }
}

async function main() {
  console.log('\n🔒 Starting post-build obfuscation...\n');

  // Delete client-side source maps (static directory only)
  console.log('Removing client-side source maps...');
  try {
    await deleteSourceMaps('.next/static');
  } catch (error) {
    console.log('  No source maps found or already removed');
  }

  // Obfuscate JS files
  console.log('\nObfuscating JavaScript files...');
  const jsFiles = await getAllJsFiles(CHUNKS_DIR);

  let obfuscated = 0;
  let skipped = 0;

  for (const file of jsFiles) {
    const result = await obfuscateFile(file);
    if (result) obfuscated++;
    else skipped++;
  }

  console.log(`\n✅ Obfuscation complete!`);
  console.log(`   Files obfuscated: ${obfuscated}`);
  console.log(`   Files skipped: ${skipped}\n`);
}

main().catch(console.error);
