#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/components/building/UploadDocumentModal.tsx',
  'src/components/building/EditDocumentModal.tsx'
];

// Comprehensive color replacements
const replacements = [
  // Background colors
  { from: /bg-gray-900/g, to: 'bg-background' },
  { from: /bg-gray-800\/50/g, to: 'bg-card/50' },
  { from: /bg-gray-800/g, to: 'bg-input' },
  { from: /bg-gray-700/g, to: 'bg-accent' },
  { from: /bg-gray-100/g, to: 'bg-accent' },
  { from: /bg-gray-50/g, to: 'bg-muted' },
  
  // Text colors
  { from: /text-white/g, to: 'text-foreground' },
  { from: /text-gray-300/g, to: 'text-foreground' },
  { from: /text-gray-400/g, to: 'text-muted-foreground' },
  { from: /text-gray-500/g, to: 'text-muted-foreground' },
  { from: /text-gray-600/g, to: 'text-muted-foreground' },
  { from: /text-gray-700/g, to: 'text-foreground' },
  { from: /text-gray-900/g, to: 'text-foreground' },
  
  // Border colors
  { from: /border-gray-800/g, to: 'border-border' },
  { from: /border-gray-700/g, to: 'border-border' },
  { from: /border-gray-600/g, to: 'border-border' },
  { from: /border-gray-300/g, to: 'border-border' },
  { from: /border-gray-200/g, to: 'border-border' },
  
  // Dashed borders
  { from: /border-dashed border-gray-700/g, to: 'border-dashed border-border' },
  
  // Purple/primary colors
  { from: /bg-purple-600\/20/g, to: 'bg-primary/20' },
  { from: /bg-purple-600/g, to: 'bg-primary' },
  { from: /text-purple-400/g, to: 'text-primary' },
  { from: /text-purple-600/g, to: 'text-primary' },
  { from: /border-purple-500/g, to: 'border-primary' },
  
  // Focus states
  { from: /focus:border-purple-500/g, to: 'focus:border-ring' },
  { from: /focus:ring-purple-500/g, to: 'focus:ring-ring' },
  { from: /focus:border-gray-300/g, to: 'focus:border-ring' },
  { from: /focus:ring-gray-300/g, to: 'focus:ring-ring' },
  
  // Placeholder colors
  { from: /placeholder-gray-500/g, to: 'placeholder-muted-foreground' },
  { from: /placeholder-gray-400/g, to: 'placeholder-muted-foreground' },
  
  // Hover states
  { from: /hover:border-gray-600/g, to: 'hover:border-border' },
  { from: /hover:bg-gray-800/g, to: 'hover:bg-accent' },
  { from: /hover:bg-gray-700/g, to: 'hover:bg-accent' },
  { from: /hover:bg-gray-100/g, to: 'hover:bg-accent' },
  { from: /hover:text-white/g, to: 'hover:text-accent-foreground' },
  { from: /hover:text-gray-900/g, to: 'hover:text-accent-foreground' },
  
  // Ring colors for focus
  { from: /ring-purple-500/g, to: 'ring-ring' },
  { from: /ring-gray-300/g, to: 'ring-ring' }
];

files.forEach(fileName => {
  const filePath = path.join(__dirname, '..', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return;
  }

  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');

  // Count initial hardcoded colors
  const initialColorCount = (content.match(/bg-gray-|text-gray-|border-gray-|text-white|bg-purple-|text-purple-|focus:border-purple-|focus:ring-purple-|hover:bg-gray-|hover:text-white|from-purple-|to-purple-|hover:from-purple-|hover:to-purple-|hover:border-gray-/g) || []).length;

  console.log(`Found ${initialColorCount} hardcoded color instances in ${fileName}`);

  // Apply all replacements
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  // Count final hardcoded colors
  const finalColorCount = (content.match(/bg-gray-|text-gray-|border-gray-|text-white|bg-purple-|text-purple-|focus:border-purple-|focus:ring-purple-|hover:bg-gray-|hover:text-white|from-purple-|to-purple-|hover:from-purple-|hover:to-purple-|hover:border-gray-/g) || []).length;

  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');

  const fixed = initialColorCount - finalColorCount;
  console.log(`✅ Fixed ${fixed} hardcoded color instances in ${fileName}`);
  console.log(`📊 Before: ${initialColorCount} → After: ${finalColorCount}`);

  if (finalColorCount > 0) {
    console.log(`⚠️  ${finalColorCount} hardcoded colors may still remain in ${fileName}`);
  }
  console.log('');
});

console.log('🎉 All building document modals updated!');