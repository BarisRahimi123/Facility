#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/components/documents/DocumentModal.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Count initial hardcoded colors
const initialColorCount = (content.match(/bg-gray-|text-gray-|border-gray-|text-white|bg-purple-|text-purple-|focus:border-purple-|focus:ring-purple-|hover:bg-gray-|hover:text-white|from-purple-|to-purple-|hover:from-purple-|hover:to-purple-|hover:bg-purple-|bg-gray-950/g) || []).length;

console.log(`Found ${initialColorCount} hardcoded color instances in DocumentModal.tsx`);

// Comprehensive color replacements
const replacements = [
  // Background colors
  { from: /bg-gray-950/g, to: 'bg-background' },
  { from: /bg-gray-900/g, to: 'bg-background' },
  { from: /bg-gray-800/g, to: 'bg-card' },
  { from: /bg-gray-700/g, to: 'bg-muted' },
  { from: /bg-gray-600/g, to: 'bg-muted' },
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
  
  // Purple/primary colors
  { from: /bg-purple-600\/20/g, to: 'bg-primary/20' },
  { from: /text-purple-400/g, to: 'text-primary' },
  { from: /border-purple-600\/50/g, to: 'border-primary/50' },
  { from: /bg-purple-600/g, to: 'bg-primary' },
  { from: /hover:bg-purple-700/g, to: 'hover:bg-primary/90' },
  { from: /text-purple-600/g, to: 'text-primary' },
  { from: /border-purple-500/g, to: 'border-primary' },
  { from: /hover:border-purple-500/g, to: 'hover:border-primary' },
  
  // Focus states
  { from: /focus:border-purple-500/g, to: 'focus:border-ring' },
  { from: /focus:ring-purple-500/g, to: 'focus:ring-ring' },
  { from: /focus:border-gray-300/g, to: 'focus:border-ring' },
  { from: /focus:ring-gray-300/g, to: 'focus:ring-ring' },
  
  // Hover states
  { from: /hover:bg-gray-800 hover:text-white/g, to: 'hover:bg-accent hover:text-accent-foreground' },
  { from: /hover:bg-gray-800/g, to: 'hover:bg-accent' },
  { from: /hover:bg-gray-700/g, to: 'hover:bg-accent' },
  { from: /hover:bg-gray-100/g, to: 'hover:bg-accent' },
  { from: /hover:text-white/g, to: 'hover:text-accent-foreground' },
  { from: /hover:text-gray-900/g, to: 'hover:text-accent-foreground' },
  
  // Ring colors for focus
  { from: /ring-purple-500/g, to: 'ring-ring' },
  { from: /ring-gray-300/g, to: 'ring-ring' }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Count final hardcoded colors
const finalColorCount = (content.match(/bg-gray-|text-gray-|border-gray-|text-white|bg-purple-|text-purple-|focus:border-purple-|focus:ring-purple-|hover:bg-gray-|hover:text-white|from-purple-|to-purple-|hover:from-purple-|hover:to-purple-|hover:bg-purple-|bg-gray-950/g) || []).length;

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

const fixed = initialColorCount - finalColorCount;
console.log(`✅ Fixed ${fixed} hardcoded color instances in DocumentModal.tsx`);
console.log(`📊 Before: ${initialColorCount} → After: ${finalColorCount}`);

if (finalColorCount > 0) {
  console.log(`⚠️  ${finalColorCount} hardcoded colors may still remain (need manual review)`);
}

console.log('🎉 DocumentModal component updated!');