/*
  # Initial Discord Bot Schema

  1. New Tables
    - `bots`
      - `id` (text, primary key) - Discord bot ID
      - `owner_id` (text) - Discord user ID of bot owner
      - `token_hash` (text) - Encrypted bot token
      - `config` (jsonb) - Bot configuration including modules
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `members`
      - `id` (uuid, primary key)
      - `user_id` (text) - Discord user ID
      - `guild_id` (text) - Discord guild ID
      - `xp` (integer, default 0)
      - `warnings` (jsonb, default [])
      - `recent_messages` (jsonb, default [])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `users`
      - `id` (text, primary key) - Discord user ID
      - `premium` (boolean, default false)
      - `votes` (integer, default 0)
      - `xp_card` (jsonb) - XP card customization
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `commands`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `summary` (text)
      - `module` (text)
      - `usage` (text)
      - `precondition` (text)
      - `created_at` (timestamp)
    
    - `logs`
      - `id` (text, primary key) - Bot ID
      - `changes` (jsonb, default [])
      - `commands` (jsonb, default [])
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create tables
CREATE TABLE IF NOT EXISTS bots (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  token_hash text,
  config jsonb DEFAULT '{
    "announce": {"enabled": true, "events": []},
    "autoMod": {"enabled": true, "ignoredRoleNames": [], "autoDeleteMessages": true, "filters": [], "banWords": [], "banLinks": [], "autoWarnUsers": true, "filterThreshold": 5},
    "commands": {"enabled": true, "configs": []},
    "general": {"enabled": true, "prefix": ".", "ignoredChannelNames": [], "autoRoleNames": []},
    "leveling": {"enabled": true, "levelRoleNames": [], "ignoredRoleNames": [], "xpPerMessage": 50, "xpCooldown": 5, "maxMessagesPerMinute": 3},
    "music": {"enabled": true},
    "settings": {"privateLeaderboard": false}
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  guild_id text NOT NULL,
  xp integer DEFAULT 0,
  warnings jsonb DEFAULT '[]'::jsonb,
  recent_messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  premium boolean DEFAULT false,
  votes integer DEFAULT 0,
  xp_card jsonb DEFAULT '{
    "backgroundURL": "",
    "primary": "#7289da",
    "secondary": "#5865f2",
    "tertiary": "#ffffff"
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  summary text,
  module text,
  usage text,
  precondition text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
  id text PRIMARY KEY,
  changes jsonb DEFAULT '[]'::jsonb,
  commands jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Bots are viewable by everyone" ON bots FOR SELECT USING (true);
CREATE POLICY "Bot owners can manage their bots" ON bots FOR ALL USING (auth.uid()::text = owner_id);

CREATE POLICY "Members are viewable by everyone" ON members FOR SELECT USING (true);
CREATE POLICY "Members can be managed by authenticated users" ON members FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can manage their own data" ON users FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Commands are viewable by everyone" ON commands FOR SELECT USING (true);
CREATE POLICY "Commands can be managed by authenticated users" ON commands FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logs are viewable by everyone" ON logs FOR SELECT USING (true);
CREATE POLICY "Logs can be managed by authenticated users" ON logs FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_user_guild ON members(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_members_xp ON members(xp DESC);
CREATE INDEX IF NOT EXISTS idx_bots_owner ON bots(owner_id);
CREATE INDEX IF NOT EXISTS idx_commands_name ON commands(name);