-- Elvis Tracker schema. Run once in the Supabase SQL editor.
-- Every row belongs to the signed-in user; row-level security keeps data private.

create table if not exists projects (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  name text not null,
  description text not null default '',
  color text not null,
  status text not null default 'active',
  budget numeric not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists tasks (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  title text not null,
  notes text not null default '',
  status text not null default 'todo',
  priority text not null default 'medium',
  horizon text not null default 'next',
  project_id text,
  due_date date,
  start_time text,
  estimate integer,
  tags text[] not null default '{}',
  subtasks jsonb not null default '[]',
  "order" double precision not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, id)
);

create table if not exists apps (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  name text not null,
  url text not null default '',
  category text not null default 'General',
  status text not null default 'live',
  billing text not null default 'monthly',
  cost numeric not null default 0,
  renewal_date date,
  project_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists expenses (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  title text not null,
  amount numeric not null,
  category text not null,
  project_id text,
  date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists habits (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  name text not null,
  color text not null,
  log text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists reflections (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null, -- Monday of the week, yyyy-MM-dd
  win text not null default '',
  slowed text not null default '',
  focus text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

do $$
declare t text;
begin
  foreach t in array array['projects', 'tasks', 'apps', 'expenses', 'habits', 'reflections'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
