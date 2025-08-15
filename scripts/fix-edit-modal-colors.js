#!/usr/bin/env node

/**
 * Fix remaining hardcoded dark mode colors in EditFacilityModal
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '..', 'src', 'components', 'facility', 'EditFacilityModal.tsx');

console.log('🎨 Fixing remaining hardcoded colors in EditFacilityModal...');

try {
  let content = readFileSync(filePath, 'utf8');
  
  // Define color replacements
  const replacements = [
    // Labels
    { from: /text-gray-300/g, to: 'text-foreground' },
    { from: /text-gray-400/g, to: 'text-muted-foreground' },
    { from: /text-white/g, to: 'text-foreground' },
    
    // Borders
    { from: /border-gray-700\/50/g, to: 'border-border' },
    { from: /border-gray-700/g, to: 'border-border' },
    { from: /border-gray-600/g, to: 'border-border' },
    
    // Backgrounds
    { from: /bg-gray-800\/50/g, to: 'bg-input' },
    { from: /bg-gray-800/g, to: 'bg-input' },
    { from: /bg-purple-600\/20/g, to: 'bg-primary/20' },
    
    // Purple colors to primary
    { from: /text-purple-400/g, to: 'text-primary' },
    { from: /focus:border-purple-500/g, to: 'focus:border-ring' },
    { from: /focus:ring-purple-500\/20/g, to: 'focus:ring-ring/20' },
    { from: /focus:ring-purple-500/g, to: 'focus:ring-ring' },
    
    // Placeholders
    { from: /placeholder-gray-400/g, to: 'placeholder-muted-foreground' },
    { from: /placeholder-gray-500/g, to: 'placeholder-muted-foreground' },
    
    // Hover states for selects
    { from: /hover:bg-gray-700/g, to: 'focus:bg-accent focus:text-accent-foreground' }
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
  
  console.log(`🎉 Fixed ${changesCount} color issues in EditFacilityModal!`);
  console.log('✨ The modal should now display correctly in both light and dark modes.');
  
} catch (error) {
  console.error('❌ Error fixing colors:', error);
}