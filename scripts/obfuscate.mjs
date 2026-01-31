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
  /\.map$/,
];

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
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
    if (code.length < 500) {
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
