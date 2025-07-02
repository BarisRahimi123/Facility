# Mapbox Setup Guide

The Mapbox integration is now installed and ready to use. You just need to add your Mapbox access token.

## Quick Setup

1. **Get a Mapbox Token**
   - Go to [https://account.mapbox.com/](https://account.mapbox.com/)
   - Sign up for a free account (if you don't have one)
   - Go to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
   - Copy your default public token or create a new one

2. **Add Token to Your Environment**
   - Create a `.env.local` file in the root of your project
   - Add the following line:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0.your-token-here
   ```
   - Replace the placeholder with your actual token

3. **Restart Your Development Server**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
   - The map should now appear in the Fields → Booking Map tab

## What's Been Added

- ✅ Installed `mapbox-gl` and `react-map-gl` packages
- ✅ Created `MapboxMap` component at `src/components/mapbox/MapboxMap.tsx`
- ✅ Integrated the map into the Fields module
- ✅ Added custom dark theme styling for Mapbox
- ✅ Set up field markers and popups
- ✅ Added map controls (zoom, navigation)

## Features

- Interactive map with dark theme matching your app
- Field markers with custom purple styling
- Click on markers to see field details
- Automatic filtering based on search and filters
- Responsive design for all screen sizes

## Troubleshooting

If you don't see the map:
1. Make sure you've added the token to `.env.local`
2. Restart your development server
3. Check the browser console for any errors
4. Verify your token is valid at mapbox.com

The map component will show a helpful placeholder with instructions if the token is missing. 