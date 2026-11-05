/*
# DebateForge — core schema (multi-user, with auth)

## Overview
Creates the tables for a debate platform where each authenticated user owns
their own debates and the messages within them. The AI opponent's replies are
stored as rows in `debate_messages` alongside the user's arguments.

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — one row per user
- `display_name` (text, not null) — name shown in the UI
- `created_at` (timestamptz)

### debates
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid()) — owner of the debate
- `topic` (text, not null) — the debate question/title
- `user_stance` (text, not null) — "for" or "against"
- `ai_stance` (text, not null) — opposite of user_stance
- `status` (text, default 'active') — 'active' | 'archived'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### debate_messages
- `id` (uuid, primary key)
- `debate_id` (uuid, references debates, cascade delete)
- `role` (text, not null) — 'user' | 'ai'
- `content` (text, not null) — the argument text
- `turn` (int, not null) — 1-based turn number
- `created_at` (timestamptz)

## 2. Security (RLS)

- RLS enabled on all tables.
- `debates` and `debate_messages` are owner-scoped: each authenticated user can
  only read/insert/update/delete rows they own (checked via the parent debate
  for messages).
- `profiles`: a user can read and update only their own profile row.
- Grants restricted to `authenticated` (the app requires sign-in).
- `service_role` granted for edge-function server-side writes.

## 3. Important Notes
1. `user_id` defaults to `auth.uid()` so frontend inserts that omit it succeed.
2. `debate_messages` ownership is validated through the parent `debates` row.
3. `updated_at` auto-refreshes via trigger on debates.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON profiles TO service_role;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- debates
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  user_stance text NOT NULL CHECK (user_stance IN ('for', 'against')),
  ai_stance text NOT NULL CHECK (ai_stance IN ('for', 'against')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON debates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON debates TO service_role;

DROP POLICY IF EXISTS "select_own_debates" ON debates;
CREATE POLICY "select_own_debates" ON debates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_debates" ON debates;
CREATE POLICY "insert_own_debates" ON debates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_debates" ON debates;
CREATE POLICY "update_own_debates" ON debates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_debates" ON debates;
CREATE POLICY "delete_own_debates" ON debates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger for debates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS debates_updated_at ON debates;
CREATE TRIGGER debates_updated_at BEFORE UPDATE ON debates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- debate_messages
CREATE TABLE IF NOT EXISTS debate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'ai')),
  content text NOT NULL,
  turn int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON debate_messages TO authenticated;
GRANT SELECT, INSERT ON debate_messages TO service_role;

CREATE INDEX IF NOT EXISTS idx_debate_messages_debate_id ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_debates_user_id ON debates(user_id);

DROP POLICY IF EXISTS "select_own_messages" ON debate_messages;
CREATE POLICY "select_own_messages" ON debate_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_messages.debate_id AND debates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_messages" ON debate_messages;
CREATE POLICY "insert_own_messages" ON debate_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_messages.debate_id AND debates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_messages" ON debate_messages;
CREATE POLICY "update_own_messages" ON debate_messages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_messages.debate_id AND debates.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_messages.debate_id AND debates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_messages" ON debate_messages;
CREATE POLICY "delete_own_messages" ON debate_messages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM debates WHERE debates.id = debate_messages.debate_id AND debates.user_id = auth.uid())
  );