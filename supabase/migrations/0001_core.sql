create extension if not exists pgcrypto;
create table organizations(id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table organization_users(organization_id uuid not null references organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'member', primary key(organization_id,user_id));
create table seasons(id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, starts_on date not null, ends_on date not null);
create table families(id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null);
create table members(id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, family_id uuid references families(id) on delete set null, first_name text not null, last_name text not null, email text, birth_date date, created_at timestamptz not null default now());
create table teams(id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, season_id uuid not null references seasons(id) on delete cascade, name text not null);
create table enrollments(id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, season_id uuid not null references seasons(id), member_id uuid not null references members(id), team_id uuid references teams(id), status text not null default 'active');

alter table organizations enable row level security; alter table organization_users enable row level security; alter table seasons enable row level security; alter table families enable row level security; alter table members enable row level security; alter table teams enable row level security; alter table enrollments enable row level security;
create or replace function public.has_org_access(org_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from organization_users ou where ou.organization_id=org_id and ou.user_id=auth.uid()) $$;
create policy "org members read organizations" on organizations for select using (has_org_access(id));
create policy "org users read membership" on organization_users for select using (user_id=auth.uid() or has_org_access(organization_id));
create policy "tenant seasons" on seasons for all using (has_org_access(organization_id)) with check (has_org_access(organization_id));
create policy "tenant families" on families for all using (has_org_access(organization_id)) with check (has_org_access(organization_id));
create policy "tenant members" on members for all using (has_org_access(organization_id)) with check (has_org_access(organization_id));
create policy "tenant teams" on teams for all using (has_org_access(organization_id)) with check (has_org_access(organization_id));
create policy "tenant enrollments" on enrollments for all using (has_org_access(organization_id)) with check (has_org_access(organization_id));
