# Facility Manager

A web-based application for managing facilities, maintenance tasks, and generating reports.

## Overview

Facility Manager is a comprehensive web application designed to help organizations manage their facilities efficiently. The application provides tools for tracking facilities, scheduling and monitoring maintenance tasks, generating reports, and configuring system settings.

## Features

- **Facilities Management**: View and manage all facilities in one place
- **Maintenance Tracking**: Create, assign, and monitor maintenance tasks
- **Reports & Analytics**: Generate comprehensive reports and view analytics
- **User Settings**: Configure application preferences and manage user accounts

## Pages

1. **Facilities**: View all facilities with key information and statistics
2. **Maintenance**: Track and manage maintenance tasks across all facilities
3. **Reports**: Generate reports and view analytics for facilities and maintenance
4. **Settings**: Configure application preferences and user settings

## Technology

This application is built using:

- HTML5
- CSS3
- JavaScript (functionality to be added)

## Getting Started

To run this application locally:

1. Clone this repository
2. Open `index.html` in your web browser
3. Navigate through the application using the menu

## Future Enhancements

- User authentication and role-based access control
- Database integration for persistent data storage
- Mobile application for on-the-go facility management
- Real-time notifications for maintenance tasks
- Integration with IoT devices for automated monitoring

## Performance Optimizations

The following optimizations have been implemented to improve application performance:

### Plans Page Optimizations
- **Lazy Loading**: Implemented lazy loading for heavy components like `PlanViewer` and `PDFViewer` using React.lazy and Suspense.
- **Pagination**: Added pagination to limit the number of plans rendered at once.
- **Local PDF Worker**: Configured PDF.js to use a local worker file instead of loading from CDN, reducing network latency.
- **Memoization**: Used React.memo and useCallback to prevent unnecessary re-renders.
- **Type Safety**: Improved type safety with proper null checks and default values.

### Maintenance Page Optimizations
- **Pagination**: Implemented pagination for maintenance tasks to limit the number of items rendered.
- **Memoization**: Used useMemo for expensive operations like filtering tasks.
- **Virtualization**: Added virtualization to the IssueTrackingBoard component using @tanstack/react-virtual.
- **Lazy Loading**: Lazy-loaded the IssueTrackingBoard component to improve initial page load time.
- **Optimized Rendering**: Improved the rendering of task cards with memoization and optimized component structure.

### General Optimizations
- **Code Splitting**: Implemented code splitting to reduce the initial bundle size.
- **Conditional Rendering**: Added proper loading states and error handling.
- **Type Safety**: Fixed TypeScript errors and improved type definitions.

These optimizations significantly improve the loading performance and responsiveness of the application, especially when dealing with large data sets or complex components like PDF viewers and drag-and-drop interfaces.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or feedback, please contact [your-email@example.com](mailto:your-email@example.com).

## Deployment

### Supabase Deployment

To deploy the database schema and migrations to Supabase:

1. Make sure your `.env.local` file contains valid Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token

> **Important**: We've encountered authentication issues with the Supabase CLI. Please see [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) for detailed workarounds and recommendations.

2. Log in to Supabase CLI (if not already logged in):
   ```bash
   npx supabase login
   ```

3. Link your project to the Supabase instance:
   ```bash
   npx supabase link --project-ref ahntaamtsypranvnofxy
   ```
   When prompted, use the database password for your Supabase project.

4. Push database migrations:
   ```bash
   npx supabase db push
   ```

5. Alternatively, use one of our scripts to handle deployment:
   ```bash
   npm run deploy:supabase    # Main deployment script
   npm run deploy:manual      # Alternative REST API script
   npm run deploy:direct      # Direct database connection script
   ```
   
   Note: The deploy:supabase script is automatically run as part of the build process (`npm run build`).

#### Manual Migration Deployment

If the automated deployment fails (which is likely due to SASL authentication issues), you can:

1. Deploy specific migrations manually via SQL Editor in Supabase Dashboard

2. Try using our alternative scripts:
   ```bash
   node scripts/manual-deploy.js 20240223_facilities
   ```

3. Use direct PostgreSQL client:
   ```bash
   PGPASSWORD='your_password' psql -h db.ahntaamtsypranvnofxy.supabase.co -U postgres -d postgres -f supabase/migrations/20240223_facilities.sql
   ```

### Production Deployment Checklist

Before deploying to production, ensure:

1. All Supabase migrations are tested and properly applied
2. Environment variables are set correctly in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your production URL)
   - All API keys and service credentials

3. Database backup is created before any major deployment:
   ```bash
   npx supabase db dump -f pre-deploy-backup.sql
   ```

4. Test the application thoroughly after deployment

### Vercel Deployment

To deploy the application to Vercel:

1. Make sure you have the Vercel CLI installed:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

Make sure to configure the following environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
