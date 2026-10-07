create table if not exists linkedin_connections (
  id bigint primary key generated always as identity,
  account_key text unique not null,
  access_token text not null,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table linkedin_connections enable row level security;
-- The server uses the Supabase service-role key, so no public policies are needed.
