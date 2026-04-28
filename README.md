# Athanasius Youth

Church person record management system built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Authentication**: Email/password login via Supabase Auth
- **People Management**: Full CRUD for church member records (contact, address, education, church info)
- **Attendance Tracking**: Record and filter attendance by person, event, and date
- **Checkup System**: Track follow-ups with method, comments, and follow-up scheduling
- **Dashboard**: Overview with stats, recent attendance, and follow-up reminders

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (Auth + Postgres)
- Tailwind CSS 4
- Deployed on Vercel

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd athanasius-youth
pnpm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings → API** and copy your project URL and anon key

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 4. Run database migrations

Go to the **SQL Editor** in your Supabase dashboard and run the contents of:

```
supabase/schema.sql
```

This creates all tables, indexes, RLS policies, and triggers.

### 5. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create your first account

Navigate to the login page and click "Create Account" to sign up. The system will automatically create a servant profile for you.

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

## Project Structure

```
src/
  app/
    login/              # Login/signup page
    auth/logout/        # Logout route handler
    (protected)/        # Auth-guarded routes
      dashboard/        # Dashboard with stats
      people/           # People list, create, profile, edit
      attendance/       # Attendance records
      checkups/         # Checkup records
  components/           # Shared UI components
  lib/
    supabase/           # Supabase client configs
    types.ts            # TypeScript types
src/proxy.ts            # Auth proxy (session refresh)
supabase/
  schema.sql            # Database schema + RLS policies
```

## Database Tables

- **servant_profiles**: Linked to Supabase Auth users (servants/admins)
- **people**: Church member records with contact, address, education, church info
- **attendance**: Attendance records linked to people and servants
- **checkups**: Follow-up checkup records with scheduling

## Security

- Row Level Security (RLS) enabled on all tables
- Only authenticated users can read/write data
- Service role key is never exposed to the client
- Auth sessions are refreshed via proxy on every request
