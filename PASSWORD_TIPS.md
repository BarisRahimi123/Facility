# Database Password Recommendations

We've found that the current database password (`@Eb745365`) is causing authentication issues when connecting to Supabase. This document provides recommendations for addressing these issues.

## Current Issues

The password `@Eb745365` contains a special character (`@`) which can cause issues:

1. In command-line environments, `@` is a special character that might need escaping
2. In URLs, `@` has special meaning (separating username from host)
3. In some PostgreSQL client libraries, special characters can cause connection problems

## Recommendations

### 1. Change the Database Password (Recommended)

The simplest solution is to change your database password to avoid special characters:

1. Log in to the Supabase dashboard
2. Go to Project Settings > Database
3. Set a new password using only letters and numbers (e.g., `NewPassword12345`)
4. Update your `.env.local` file with the new password
5. Update any CI/CD environment variables

### 2. Proper Escaping in Command Line

If you need to use the current password in CLI commands:

```bash
# Using single quotes (preferred on Unix/macOS)
npx supabase link --project-ref ahntaamtsypranvnofxy --password '@Eb745365'

# Using double quotes with backslash escaping
npx supabase link --project-ref ahntaamtsypranvnofxy --password "\@Eb745365"

# Using environment variable
DB_PASSWORD='@Eb745365' npx supabase link --project-ref ahntaamtsypranvnofxy
```

### 3. URL Encoding in Connection Strings

If using the password in connection strings:

```
postgresql://postgres:%40Eb745365@db.ahntaamtsypranvnofxy.supabase.co:5432/postgres
```

Note: `%40` is the URL-encoded form of `@`

### 4. Using Password Files for PostgreSQL

For native PostgreSQL tools:

1. Create a `.pgpass` file:
   ```
   db.ahntaamtsypranvnofxy.supabase.co:5432:postgres:postgres:@Eb745365
   ```

2. Set permissions:
   ```bash
   chmod 600 ~/.pgpass
   ```

3. Use without specifying password:
   ```bash
   psql -h db.ahntaamtsypranvnofxy.supabase.co -U postgres -d postgres
   ```

## Next Steps

1. Change the password to something without special characters
2. Update all environment variables and configuration files
3. Test the database connection again using `npm run deploy:supabase`

If issues persist after changing the password, please contact Supabase support for further assistance. 