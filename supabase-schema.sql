-- supabase-schema.sql
--
-- RUN ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again, and safe on the database from the previous site:
-- everything is "if not exists", so existing orders and photos are kept.

-- ---------------------------------------------------------------------------
-- Orders — the online pickup orders. Kept permanently as the sales record.
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  customer_name text        not null,
  phone         text        not null,
  pickup_time   text        not null,
  email         text,
  order_notes   text,
  items         jsonb       not null,
  total         numeric(8,2),
  -- new → accepted → collected, or rejected at any point
  status        text        not null default 'new',
  wait_minutes  int,
  -- Set when the weekly digest has emailed this order. Never deleted.
  archived_at   timestamptz,
  constraint orders_status_check check (status in ('new', 'accepted', 'rejected', 'collected'))
);

-- Upgrading from the previous site's database:
alter table orders add column if not exists total numeric(8,2);
alter table orders add column if not exists archived_at timestamptz;

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_archived_idx on orders (archived_at) where archived_at is null;

-- ---------------------------------------------------------------------------
-- Catering enquiries
-- ---------------------------------------------------------------------------
create table if not exists enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  email       text,
  event_date  text not null,
  headcount   int  not null,
  fulfilment  text,
  notes       text,
  handled_at  timestamptz
);
create index if not exists enquiries_created_at_idx on enquiries (created_at desc);

-- ---------------------------------------------------------------------------
-- Site content — what staff change from /admin: photo walls, ordering switch
-- ---------------------------------------------------------------------------
create table if not exists site_content (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);
insert into site_content (key, value) values
  ('team_photos', '[]'),
  ('parea_photos', '[]'),
  ('ordering', '{"paused":false}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Push subscriptions — devices that asked to be pinged. order_ref is either
-- a customer's order UUID (expires in meaning once collected) or "kitchen".
-- Optional: until this exists, the site simply can't send push and says so
-- quietly. Re-run this whole file if you're catching up; it's idempotent.
-- ---------------------------------------------------------------------------
create table if not exists push_subscriptions (
  id         bigint generated always as identity primary key,
  order_ref  text not null,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_ref_idx on push_subscriptions (order_ref);
-- One device can follow the kitchen AND any number of orders. (Older setups
-- had endpoint unique, so a second order silently replaced the first.)
alter table push_subscriptions drop constraint if exists push_subscriptions_endpoint_key;
create unique index if not exists push_subscriptions_ref_endpoint_idx on push_subscriptions (order_ref, endpoint);
alter table push_subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- Staff sign-ins. One row per signed-in browser. A session stays signed in
-- for as long as one of its staff tabs is open — a sleeping screen doesn't
-- count — and ends about a minute after its last tab closes. At most 3 staff
-- sessions at once; the admin password never uses a slot.
-- ---------------------------------------------------------------------------
create table if not exists staff_sessions (
  id         uuid primary key default gen_random_uuid(),
  device     text,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
alter table staff_sessions add column if not exists role text not null default 'staff';
-- Ids of the tabs this session has open, and when its last tab closed.
alter table staff_sessions add column if not exists tabs text[] not null default '{}';
alter table staff_sessions add column if not exists closing_at timestamptz;
alter table staff_sessions enable row level security;

-- An open tab checks in: remember it, and cancel any pending close (a page
-- reload closes and reopens the same tab within a second or two). Returns
-- false when the session has already ended.
create or replace function staff_session_beat(p_id uuid, p_tab text, p_grace_seconds int)
returns boolean
language sql volatile as $$
  with s as (
    update staff_sessions
       set tabs = case when p_tab = any(tabs) then tabs else tabs || p_tab end,
           closing_at = null,
           last_seen = now()
     where id = p_id
       and (closing_at is null or closing_at > now() - make_interval(secs => p_grace_seconds))
    returning 1
  )
  select exists (select 1 from s);
$$;

-- A tab closed. When it was the session's last tab, start the short countdown
-- after which the session ends.
create or replace function staff_session_tab_closed(p_id uuid, p_tab text)
returns void
language sql volatile as $$
  update staff_sessions
     set tabs = array_remove(tabs, p_tab),
         closing_at = case when cardinality(array_remove(tabs, p_tab)) = 0 then now() else closing_at end
   where id = p_id;
$$;
revoke execute on function staff_session_beat(uuid, text, int) from public, anon, authenticated;
revoke execute on function staff_session_tab_closed(uuid, text) from public, anon, authenticated;
grant execute on function staff_session_beat(uuid, text, int) to service_role;
grant execute on function staff_session_tab_closed(uuid, text) to service_role;

-- Login attempts per device (a hashed IP address — never the raw address).
-- 5 attempts in 15 minutes, then that device is locked out for 15 minutes.
create table if not exists staff_login_attempts (
  client       text primary key,
  attempts     int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);
alter table staff_login_attempts enable row level security;

-- Counts an attempt in one atomic step, BEFORE the password is checked, so a
-- burst of parallel guesses can't slip past the limit. While locked, nothing
-- changes; once a lock or the 15-minute window has passed, counting restarts.
create or replace function staff_login_attempt(p_client text, p_window_minutes int)
returns table (attempts int, locked_until timestamptz)
language sql volatile as $$
  insert into staff_login_attempts as a (client, attempts, window_start, locked_until)
  values (p_client, 1, now(), null)
  on conflict (client) do update set
    attempts = case
      when a.locked_until > now() then a.attempts
      when a.locked_until is not null or a.window_start < now() - make_interval(mins => p_window_minutes) then 1
      else a.attempts + 1 end,
    window_start = case
      when a.locked_until > now() then a.window_start
      when a.locked_until is not null or a.window_start < now() - make_interval(mins => p_window_minutes) then now()
      else a.window_start end,
    locked_until = case when a.locked_until > now() then a.locked_until else null end
  returning a.attempts, a.locked_until;
$$;
revoke execute on function staff_login_attempt(text, int) from public, anon, authenticated;
grant execute on function staff_login_attempt(text, int) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security — locked down. The site only talks to these tables from
-- server code with the service_role key (which bypasses RLS), so with no
-- permissive policy a leaked anon key reads nothing.
-- ---------------------------------------------------------------------------
alter table orders enable row level security;
alter table enquiries enable row level security;
alter table site_content enable row level security;

-- ---------------------------------------------------------------------------
-- Storage — create in Supabase → Storage → New bucket:
--   Name: media     Public: YES   (photos are shown on public pages)
-- Uploads happen server-side only, so the public bucket is read-only to the world.
-- ---------------------------------------------------------------------------
