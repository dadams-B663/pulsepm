# PulsePM - Product Management for IT Teams

A modern, real-time collaborative product management application built with Supabase.

## Features

- **Task Management** - Create, prioritize, and track tasks with status updates
- **Todo System** - Shared todos with progress tracking and assignment
- **File Sharing** - Upload and share documents with your team
- **AI Capture** - Extract action items from Teams conversations
- **Team Management** - Role-based permissions with invite system
- **Real-time Sync** - All changes sync instantly across all users

---

## Quick Start Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Enter a name (e.g., "PulsePM") and set a database password
4. Wait for the project to be created

### Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### Step 3: Configure the App

1. Open `config.js` in this folder
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### Step 4: Set Up the Database

1. In Supabase, go to **SQL Editor**
2. Click **"New query"**
3. Paste the following SQL and click **"Run"**:

```sql
-- =============================================
-- PULSEPM DATABASE SCHEMA
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'IT Associate',
  department TEXT DEFAULT 'BCRP',
  permissions JSONB DEFAULT '{"admin": false, "edit": true, "see": true, "share": false}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Not started',
  assignee_id UUID REFERENCES profiles(id),
  assignee_name TEXT DEFAULT 'Unassigned',
  team TEXT DEFAULT 'General',
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'Not started',
  progress INTEGER DEFAULT 0,
  priority TEXT,
  due_date DATE,
  assignee_id UUID REFERENCES profiles(id),
  task_id UUID REFERENCES tasks(id),
  locked BOOLEAN DEFAULT FALSE,
  is_from_task BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER DEFAULT 0,
  notes TEXT,
  link TEXT,
  data_url TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  recipient_name TEXT,
  role TEXT,
  permissions JSONB,
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  used BOOLEAN DEFAULT FALSE,
  used_by TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Tasks are viewable by everyone" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tasks" ON tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tasks" ON tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Todos policies
CREATE POLICY "Todos are viewable by everyone" ON todos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update todos" ON todos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete todos" ON todos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Files policies
CREATE POLICY "Files are viewable by everyone" ON files
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert files" ON files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update files" ON files
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete files" ON files
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Invites policies
CREATE POLICY "Invites are viewable by everyone" ON invites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert invites" ON invites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update invites" ON invites
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete invites" ON invites
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =============================================
-- ENABLE REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
```

### Step 5: Configure Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) Go to **Authentication** → **Email Templates** to customize emails
4. (Optional) Disable "Confirm email" in **Authentication** → **Settings** for easier testing

### Step 6: Create Your First Admin User

1. Open `index.html` in your browser (or serve it via a local server)
2. Click **"Create Account"**
3. Fill in your details and register
4. Your first user will have default permissions

To make yourself an admin:

1. Go to Supabase **Table Editor** → **profiles**
2. Find your user row
3. Edit the `permissions` column to:
```json
{"admin": true, "edit": true, "see": true, "share": true}
```

---

## Hosting Options

### Option A: Local Development

Just open `index.html` directly in your browser.

### Option B: Static Hosting (Recommended for Teams)

Deploy to a free static host so your team can access it:

**GitHub Pages:**
1. Push this folder to a GitHub repo
2. Go to repo **Settings** → **Pages**
3. Select your branch and save
4. Access at `https://yourusername.github.io/repo-name`

**Netlify:**
1. Drag and drop this folder to [netlify.com/drop](https://netlify.com/drop)
2. Get an instant URL

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this folder
3. Follow the prompts

---

## Troubleshooting

### "Please configure Supabase" error
- Make sure you've updated `config.js` with your real Supabase credentials

### "Invalid email or password"
- Check that the email is registered in Supabase **Authentication** → **Users**
- Make sure email confirmation is disabled or the user confirmed their email

### Changes not syncing
- Check the browser console for errors
- Verify RLS policies are set up correctly
- Ensure realtime is enabled for your tables

### Can't create tasks/todos
- Check your user's `permissions` in the `profiles` table
- Make sure `edit` is set to `true`

---

## Support

For issues or questions, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
