# Field Reservation UI Color Fix

## Issue
The field reservation UI had mixed colors - some elements using hardcoded dark theme colors (gray-800, text-white) while others used light theme colors (gray-700, gray-600), causing a mixed appearance.

## Root Cause
Components were using hardcoded Tailwind color classes instead of semantic CSS variables that adapt to the current theme.

## Solution Applied
Updated all hardcoded colors to use semantic CSS variables:

### Color Mappings
- `text-gray-700` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `bg-gray-50` → `bg-muted`
- `border-gray-200` → `border-border`
- `text-white` → `text-popover-foreground`
- `bg-gray-800` → `bg-popover`
- `hover:bg-gray-700` → `hover:bg-accent hover:text-accent-foreground`
- `text-blue-600` → `text-primary`
- `bg-blue-600 hover:bg-blue-700` → `bg-primary hover:bg-primary/90`

### Additional Colors Added
Added warning color variables for time slot availability messages:
```css
/* Light theme */
--warning: 38 92% 50%;
--warning-foreground: 38 92% 95%;

/* Dark theme */  
--warning: 38 92% 50%;
--warning-foreground: 38 92% 10%;
```

## Files Modified
1. `src/components/facility/FacilityRentalModal.tsx` - Updated all hardcoded colors
2. `src/app/globals.css` - Added warning color variables
3. `tailwind.config.ts` - Added warning color to Tailwind theme

## Result
The field reservation UI now properly adapts to light/dark themes with consistent colors throughout the booking form. 