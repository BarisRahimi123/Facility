#!/usr/bin/env node

/**
 * Fix hardcoded dark mode colors in EditBuildingModal
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '..', 'src', 'components', 'building', 'EditBuildingModal.tsx');

console.log('🎨 Fixing hardcoded colors in EditBuildingModal...');

try {
  let content = readFileSync(filePath, 'utf8');
  
  // Define color replacements
  const replacements = [
    // Dialog
    { from: /bg-gray-900 border-gray-800/g, to: 'bg-background border-border' },
    
    // Text colors
    { from: /text-white/g, to: 'text-foreground' },
    { from: /text-gray-300/g, to: 'text-foreground' },
    { from: /text-gray-400/g, to: 'text-muted-foreground' },
    { from: /text-gray-500/g, to: 'text-muted-foreground' },
    
    // Backgrounds
    { from: /bg-gray-800/g, to: 'bg-input' },
    { from: /bg-gray-700/g, to: 'bg-accent' },
    
    // Borders
    { from: /border-gray-700/g, to: 'border-border' },
    { from: /border-gray-800/g, to: 'border-border' },
    
    // Purple colors to primary
    { from: /text-purple-400/g, to: 'text-primary' },
    { from: /bg-purple-600/g, to: 'bg-primary' },
    { from: /bg-purple-700/g, to: 'bg-primary/90' },
    { from: /hover:bg-purple-700/g, to: 'hover:bg-primary/90' },
    { from: /focus:border-purple-500/g, to: 'focus:border-ring' },
    { from: /focus:ring-purple-500/g, to: 'focus:ring-ring' },
    
    // Placeholders
    { from: /placeholder-gray-500/g, to: 'placeholder-muted-foreground' },
    { from: /placeholder-gray-400/g, to: 'placeholder-muted-foreground' },
    
    // Hover states
    { from: /hover:bg-gray-800 hover:text-white/g, to: 'hover:bg-accent hover:text-accent-foreground' },
    { from: /focus:bg-gray-700 focus:text-white/g, to: 'focus:bg-accent focus:text-accent-foreground' },
    
    // SelectContent
    { from: /bg-gray-800 border-gray-700/g, to: 'bg-popover border-border' }
  ];
  
  // Apply all replacements
  let changesCount = 0;
  replacements.forEach(({ from, to }) => {
    const beforeCount = (content.match(from) || []).length;
    content = content.replace(from, to);
    const afterCount = (content.match(from) || []).length;
    const changes = beforeCount - afterCount;
    if (changes > 0) {
      console.log(`✅ Replaced ${changes} instances of ${from.source} → ${to}`);
      changesCount += changes;
    }
  });
  
  // Write the updated content back
  writeFileSync(filePath, content, 'utf8');
  
  console.log(`🎉 Fixed ${changesCount} color issues in EditBuildingModal!`);
  console.log('✨ The modal should now display correctly in both light and dark modes.');
  
} catch (error) {
  console.error('❌ Error fixing colors:', error);
}