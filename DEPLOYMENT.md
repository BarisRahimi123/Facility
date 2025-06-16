# Deployment Guide

This document provides detailed instructions for deploying the Fieldwire application to production environments.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI installed globally (`npm install -g supabase`)
- Valid Supabase account with access to the Fieldwire project
- Vercel account with access to the Fieldwire project

## Deployment Flow

The application uses a continuous deployment workflow:

1. Changes are pushed to the main branch
2. GitHub Actions verify code quality
3. Database migrations are applied to Supabase
4. The application is deployed to Vercel

## Database Deployment

### Initial Setup

1. Install Supabase CLI globally:
   ```bash
   npm install -g supabase
   ```

2. Set up local environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ahntaamtsypranvnofxy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ACCESS_TOKEN=your-access-token
   ```

3. Log in to Supabase CLI:
   ```bash
   supabase login
   ```

4. Link your local project to the Supabase project:
   ```bash
   supabase link --project-ref ahntaamtsypranvnofxy
   ```

### Creating and Applying Migrations

1. After making database changes locally, generate a migration:
   ```bash
   supabase db diff -f migration_name
   ```

2. Review the generated migration in `supabase/migrations/`.

3. Apply the migration to production:
   ```bash
   supabase db push
   ```

4. In case of issues, use the manual deployment script:
   ```bash
   node scripts/manual-deploy.js
   ```

### Database Backup

Always create a database backup before major deployments:

```bash
supabase db dump -f pre-deploy-backup.sql
```

To restore from a backup if needed:

```bash
supabase db restore -f pre-deploy-backup.sql
```

## Frontend Deployment

### Deploying to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the application:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

### Environment Variables

Ensure the following environment variables are set in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_APP_URL`: The URL of your deployed application
- `SENDGRID_API_KEY`: SendGrid API key for email functionality
- `SENDGRID_FROM_EMAIL`: Email address to send from
- `TWILIO_ACCOUNT_SID`: Twilio account SID for SMS functionality
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

## Testing the Deployment

After deployment, verify:

1. Authentication works correctly
2. Tasks can be created and updated
3. Facilities can be browsed and managed
4. Plans can be viewed and edited
5. Email notifications are sent properly
6. The application is responsive on all device sizes

## Rollback Procedure

If issues occur after deployment:

1. Revert to the previous version in Vercel:
   ```bash
   vercel rollback
   ```

2. Restore the database from backup if needed:
   ```bash
   supabase db restore -f pre-deploy-backup.sql
   ```

## Monitoring and Logging

Monitor the application after deployment:

1. Check Vercel logs for application errors
2. Monitor Supabase query performance
3. Set up alerts for critical errors
4. Check Twilio and SendGrid dashboards for messaging status

## Support

For deployment issues, contact:
- Your Supabase administrator
- Your Vercel project administrator
- The development team lead 