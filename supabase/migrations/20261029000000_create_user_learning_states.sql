-- SinauuEnglish cloud sync: one private JSON snapshot per authenticated account.
-- Never put a service-role key in browser code.
create table if not exists public.user_learning_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_learning_states enable row level security;
revoke all on table public.user_learning_states from anon, authenticated;
grant select, insert, update on public.user_learning_states to authenticated;

drop policy if exists "Users read their own learning state" on public.user_learning_states;
create policy "Users read their own learning state" on public.user_learning_states
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "Users insert their own learning state" on public.user_learning_states;
create policy "Users insert their own learning state" on public.user_learning_states
  for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "Users update their own learning state" on public.user_learning_states;
create policy "Users update their own learning state" on public.user_learning_states
  for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

comment on table public.user_learning_states is 'Per-account SinauuEnglish learning state. RLS restricts access to auth.uid() = user_id.';
