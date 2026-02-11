// Codama generation script for Squads Smart Account Program
// Generates Kit-native TypeScript client from Anchor IDL

import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Anchor IDL
const idlPath = path.join(__dirname, 'squads_smart_account_program.json');
const anchorIdl = JSON.parse(readFileSync(idlPath, 'utf-8'));

console.log(`Loading IDL: ${anchorIdl.metadata?.name || anchorIdl.name}`);

// Convert Anchor IDL to Codama nodes
const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));

// Generate Kit-native TypeScript client
const outputDir = path.join(__dirname, 'src', 'generated');

console.log(`Generating client to: ${outputDir}`);

codama.accept(renderVisitor(outputDir, {
  // Use Kit-native types and patterns
  dependencyMap: {},
}));

console.log('Generation complete!');

// Post-generation: Patch the types/index.ts to include custom types
const typesIndexPath = path.join(outputDir, 'types', 'index.ts');

if (existsSync(typesIndexPath)) {
  console.log('Patching generated types to include custom codecs...');
  const typesIndex = readFileSync(typesIndexPath, 'utf-8');

  // Add custom types export at the end
  const customExport = `
// Custom types for SmallVec serialization and events
export * from "../../types";
`;

  if (!typesIndex.includes('../../types')) {
    appendFileSync(typesIndexPath, customExport);
    console.log('Patched types/index.ts with custom types export');
  } else {
    console.log('Types already patched');
  }
} else {
  console.log('No types/index.ts found - skipping patch');
}

console.log('All done!');
