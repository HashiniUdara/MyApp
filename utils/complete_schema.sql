-- ================================================================
--  MyApp — Complete Database Schema (Single File)
--  Run this in: Supabase Dashboard → SQL Editor → New query
--
--  This is the ONLY schema file you need.
--
--  SAFE TO RE-RUN: uses CREATE IF NOT EXISTS, CREATE OR REPLACE, and
--  DROP POLICY/TRIGGER IF EXISTS throughout. Nothing here drops a table
--  or deletes rows, so re-running this against an existing database
--  will NOT touch your existing data — EXCEPT for one guarded cleanup
--  step below, which only removes a table if it's confirmed empty
--  (see "CLEANUP: old unused finance-summary system" further down).
--
--  CLEANUP: OLD UNUSED FINANCE-SUMMARY SYSTEM
--  Your previous schema had a leftover, never-wired-up system:
--  `monthly_finance_summaries` + `refresh_previous_month_finance_summaries()`.
--  Nothing in the app code calls either of these, and its cron job was
--  never actually scheduled. This file removes them for good, via a
--  guarded step near the top that only drops the table if it's empty —
--  if it happens to have rows in your database, the drop is skipped
--  and you'll see a NOTICE telling you so, so you can decide by hand.
--  The system this app actually uses is `monthly_summaries` +
--  `get_year_finance_overview()`, defined further down.
-- ================================================================

-- ── 0. CLEANUP (drop old shared tables replaced by per-user ones) ─
-- Only uncomment these if you're starting fresh:
-- drop table if exists habit_completions cascade;
-- drop table if exists habits cascade;
-- drop table if exists todos cascade;
-- drop table if exists transactions cascade;
-- drop table if exists reminders cascade;
-- drop table if exists todo_categories cascade;
-- drop table if exists transaction_categories cascade;
-- drop table if exists saving_categories cascade;
-- drop table if exists savings cascade;
-- drop table if exists notes cascade;
-- drop table if exists monthly_budgets cascade;
-- drop table if exists monthly_summaries cascade;

-- ── 0b. GUARDED CLEANUP of the old, unused finance-summary system ─
-- Only drops monthly_finance_summaries if it exists AND is empty.
-- If it has rows, it's left alone and you'll see a NOTICE about it.
do $$
declare
  v_count bigint;
begin
  if to_regclass('public.monthly_finance_summaries') is not null then
    execute 'select count(*) from monthly_finance_summaries' into v_count;
    if v_count = 0 then
      drop table if exists monthly_finance_summaries cascade;
      raise notice 'Removed unused table monthly_finance_summaries (it was empty).';
    else
      raise notice 'monthly_finance_summaries has % row(s) — NOT dropped automatically. Review it and drop manually if you do not need it: drop table monthly_finance_summaries cascade;', v_count;
    end if;
  end if;
  if to_regprocedure('public.refresh_previous_month_finance_summaries()') is not null then
    drop function public.refresh_previous_month_finance_summaries();
    raise notice 'Removed unused function refresh_previous_month_finance_summaries() (it was never called by the app).';
  end if;
end $$;

-- ================================================================
--  PER-USER TABLES (each row belongs to one user via user_id)
-- ================================================================

-- ── 1. TRANSACTION CATEGORIES (per user) ─────────────────────────
create table if not exists transaction_categories (
  id            serial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('expense','income')),
  name          text not null,
  subcategories text[] not null default '{}',
  created_at    timestamptz default now()
);

-- ── 2. TODO CATEGORIES (per user) ────────────────────────────────
create table if not exists todo_categories (
  id         text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  icon       text not null default 'pricetag-outline',
  color      text not null default '#2DA49E',
  created_at timestamptz default now(),
  primary key (id, user_id)
);

-- ── 3. SAVING CATEGORIES (per user) ──────────────────────────────
create table if not exists saving_categories (
  id         serial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  created_at timestamptz default now(),
  unique (user_id, label)
);

-- ── 4. TRANSACTIONS (per user) ────────────────────────────────────
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('expense','income')),
  category    text not null,
  subcategory text not null,
  description text not null default '',
  amount      numeric(12,2) not null check (amount > 0),
  date        text not null,   -- 'YYYY-MM-DD HH:MM'
  created_at  timestamptz default now()
);

-- ── 5. SPLIT BILL PEOPLE (per user) ─────────────────────────────
create table if not exists split_bill_people (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

-- ── 5b. SPLIT BILL GROUPS (per user) ────────────────────────────
create table if not exists split_bill_groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  member_ids  uuid[] not null default '{}',
  created_at  timestamptz default now()
);

-- ── 6. SPLIT BILL EXPENSES (per user) ───────────────────────────
create table if not exists split_bill_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null default '',
  amount      numeric(12,2) not null check (amount > 0),
  paid_by     uuid not null references split_bill_people(id),
  group_id    uuid references split_bill_groups(id),
  date        text not null,   -- 'YYYY-MM-DD'
  split_with  uuid[] not null default '{}',
  split_type  text not null check (split_type in ('equally','byAmount','byPercentage')) default 'equally',
  splits      jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists split_bill_settlements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  group_id     uuid not null references split_bill_groups(id),
  from_person  uuid not null references split_bill_people(id),
  to_person    uuid not null references split_bill_people(id),
  amount       numeric(12,2) not null check (amount > 0),
  created_at   timestamptz default now()
);

-- ── 7. (removed) monthly_finance_summaries ────────────────────────
-- This unused table was cleaned up above in step 0b. It is intentionally
-- not re-created here. See `monthly_summaries` (step 13 below) for the
-- table this app actually uses.

-- ── 6. TODOS (per user) ───────────────────────────────────────────
create table if not exists todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  notes       text not null default '',
  category    text not null default 'general',
  date        text not null,   -- 'YYYY-MM-DD'
  time        text,            -- 'HH:MM' or null
  completed   boolean not null default false,
  created_at  timestamptz default now()
);

-- ── 7. HABITS (per user) ──────────────────────────────────────────
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  emoji       text not null default '🎯',
  color       text not null default '#2DA49E',
  created_at  timestamptz default now()
);

-- ── 8. HABIT COMPLETIONS (linked to habit, inherits user via habit) ─
create table if not exists habit_completions (
  habit_id    uuid not null references habits(id) on delete cascade,
  date        text not null,   -- 'YYYY-MM-DD'
  primary key (habit_id, date)
);

-- ── 9. REMINDERS (per user) ───────────────────────────────────────
create table if not exists reminders (
  id          text not null,   -- 'transactions' | 'todos' | 'habits'
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  enabled     boolean not null default false,
  hour        integer not null default 21 check (hour between 0 and 23),
  minute      integer not null default 0  check (minute between 0 and 59),
  updated_at  timestamptz default now(),
  primary key (id, user_id)
);

-- ── 10. NOTES (per user) ───────────────────────────────────────────
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  body        text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 11. MONTHLY BUDGETS (per user) ────────────────────────────────
create table if not exists monthly_budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  month      text not null,   -- 'YYYY-MM'
  amount     numeric(12,2) not null check (amount >= 0),
  updated_at timestamptz default now(),
  unique (user_id, month)
);

-- ── 12. SAVINGS (per user) ────────────────────────────────────────
create table if not exists savings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null,
  amount     numeric(12,2) not null check (amount > 0),
  date       text not null,   -- 'YYYY-MM-DD'
  note       text not null default '',
  created_at timestamptz default now()
);

-- ── 13. MONTHLY SUMMARIES — ACTIVE (per user) ─────────────────────
-- Powers the Finance Graph screen. One row per user per calendar month,
-- storing total income, total expense, and category-wise breakdown for
-- that month. Finalized months are filled in by a scheduled job (see
-- generate_previous_month_summaries below); the current, still-open
-- month is always computed live by get_year_finance_overview instead of
-- read from here.
create table if not exists monthly_summaries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  year                integer not null,
  month               integer not null check (month between 1 and 12),
  total_income        numeric(14,2) not null default 0,
  total_expense       numeric(14,2) not null default 0,
  income_by_category  jsonb not null default '{}'::jsonb,
  expense_by_category jsonb not null default '{}'::jsonb,
  updated_at          timestamptz not null default now(),
  unique (user_id, year, month)
);

-- ================================================================
--  ROW LEVEL SECURITY — each user only sees their own data
-- ================================================================

-- transaction_categories
alter table transaction_categories enable row level security;
drop policy if exists "users manage own tx categories" on transaction_categories;
create policy "users manage own tx categories" on transaction_categories
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- todo_categories
alter table todo_categories enable row level security;
drop policy if exists "users manage own todo categories" on todo_categories;
create policy "users manage own todo categories" on todo_categories
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- saving_categories
alter table saving_categories enable row level security;
drop policy if exists "users manage own saving categories" on saving_categories;
create policy "users manage own saving categories" on saving_categories
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions
alter table transactions enable row level security;
drop policy if exists "users manage own transactions" on transactions;
create policy "users manage own transactions" on transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- split_bill_people
alter table split_bill_people enable row level security;
drop policy if exists "users manage own split bill people" on split_bill_people;
create policy "users manage own split bill people" on split_bill_people
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- split_bill_groups
alter table split_bill_groups enable row level security;
drop policy if exists "users manage own split bill groups" on split_bill_groups;
create policy "users manage own split bill groups" on split_bill_groups
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- split_bill_expenses
alter table split_bill_expenses enable row level security;
drop policy if exists "users manage own split bill expenses" on split_bill_expenses;
create policy "users manage own split bill expenses" on split_bill_expenses
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- split_bill_settlements
alter table split_bill_settlements enable row level security;
drop policy if exists "users manage own split bill settlements" on split_bill_settlements;
create policy "users manage own split bill settlements" on split_bill_settlements
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table split_bill_expenses
  add constraint split_bill_expenses_split_type_check
    check (split_type in ('equally','byAmount','byPercentage'));

-- todos
alter table todos enable row level security;
drop policy if exists "users manage own todos" on todos;
create policy "users manage own todos" on todos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habits
alter table habits enable row level security;
drop policy if exists "users manage own habits" on habits;
create policy "users manage own habits" on habits
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habit_completions (access via habit ownership)
alter table habit_completions enable row level security;
drop policy if exists "users manage own completions" on habit_completions;
create policy "users manage own completions" on habit_completions
  using (exists (
    select 1 from habits where habits.id = habit_id and habits.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from habits where habits.id = habit_id and habits.user_id = auth.uid()
  ));

-- reminders
alter table reminders enable row level security;
drop policy if exists "users manage own reminders" on reminders;
create policy "users manage own reminders" on reminders
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notes
alter table notes enable row level security;
drop policy if exists "users manage own notes" on notes;
create policy "users manage own notes" on notes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- monthly_budgets
alter table monthly_budgets enable row level security;
drop policy if exists "users manage own monthly budgets" on monthly_budgets;
create policy "users manage own monthly budgets" on monthly_budgets
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- savings
alter table savings enable row level security;
drop policy if exists "users manage own savings" on savings;
create policy "users manage own savings" on savings
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- monthly_summaries (active — powers the Finance Graph)
alter table monthly_summaries enable row level security;
drop policy if exists "users manage own monthly summaries" on monthly_summaries;
create policy "users manage own monthly summaries" on monthly_summaries
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================================================================
--  AUTO-SETUP: when a new user signs up, create their default data
-- ================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Default reminders
  insert into public.reminders (id, user_id, label, enabled, hour, minute) values
    ('transactions', new.id, 'Log Transactions', false, 21, 0),
    ('todos',        new.id, 'Review Todos',     false, 20, 0),
    ('habits',       new.id, 'Check Habits',     false, 22, 0)
  on conflict (id, user_id) do nothing;

  -- Default expense categories (1 category, 1 subcategory each)
  insert into public.transaction_categories (user_id, type, name, subcategories) values
    (new.id, 'expense', 'General', array['Expense']),
    (new.id, 'income',  'General', array['Income'])
  on conflict do nothing;

  -- Default todo category
  insert into public.todo_categories (id, user_id, label, icon, color) values
    ('general_' || new.id, new.id, 'General', 'pricetag-outline', '#2DA49E')
  on conflict do nothing;

  -- Default saving category
  insert into public.saving_categories (user_id, label) values
    (new.id, 'General')
  on conflict (user_id, label) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ================================================================
--  ACTIVE FINANCE-GRAPH SUPPORT FUNCTIONS
--  These power the Finance Graph screen (store/financeApi.js) and
--  ARE scheduled to run automatically — see the cron.schedule call
--  below. You do not need to run these manually.
-- ================================================================

-- ── Compute + store one user's summary for one month ──────────────
create or replace function generate_monthly_summary(p_user_id uuid, p_year int, p_month int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix       text := to_char(make_date(p_year, p_month, 1), 'YYYY-MM');
  v_income       numeric(14,2);
  v_expense      numeric(14,2);
  v_income_cat   jsonb;
  v_expense_cat  jsonb;
begin
  select coalesce(sum(amount) filter (where type = 'income'),  0),
         coalesce(sum(amount) filter (where type = 'expense'), 0)
    into v_income, v_expense
    from transactions
    where user_id = p_user_id and date like v_prefix || '%';

  select coalesce(jsonb_object_agg(category, cat_total), '{}'::jsonb) into v_income_cat
    from (
      select category, sum(amount) as cat_total from transactions
      where user_id = p_user_id and type = 'income' and date like v_prefix || '%'
      group by category
    ) t;

  select coalesce(jsonb_object_agg(category, cat_total), '{}'::jsonb) into v_expense_cat
    from (
      select category, sum(amount) as cat_total from transactions
      where user_id = p_user_id and type = 'expense' and date like v_prefix || '%'
      group by category
    ) t;

  insert into monthly_summaries
    (user_id, year, month, total_income, total_expense, income_by_category, expense_by_category, updated_at)
  values
    (p_user_id, p_year, p_month, v_income, v_expense, v_income_cat, v_expense_cat, now())
  on conflict (user_id, year, month) do update set
    total_income        = excluded.total_income,
    total_expense        = excluded.total_expense,
    income_by_category  = excluded.income_by_category,
    expense_by_category = excluded.expense_by_category,
    updated_at           = now();
end;
$$;

-- ── Finalize *previous* month for every user (runs on the 1st) ────
create or replace function generate_previous_month_summaries()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev  date := (date_trunc('month', now()) - interval '1 month');
  v_year  int  := extract(year  from v_prev);
  v_month int  := extract(month from v_prev);
  r record;
begin
  for r in select id from auth.users loop
    perform generate_monthly_summary(r.id, v_year, v_month);
  end loop;
end;
$$;

-- Schedule it: 00:05 UTC on the 1st of every month, for the month that just ended. 
-- Requires the pg_cron extension (Database → Extensions).
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'generate-monthly-summaries') then
    perform cron.unschedule('generate-monthly-summaries');
  end if;
end $$;

select cron.schedule(
  'generate-monthly-summaries',
  '5 0 1 * *',
  $$select generate_previous_month_summaries();$$
);

-- ── What the app calls — one read per year selected ───────────────
-- Uses the stored summary for any finished month, and computes live
-- for the current (in-progress) month or any month with no stored
-- row yet (e.g. historical months from before this feature existed).
create or replace function get_year_finance_overview(p_year int)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user          uuid := auth.uid();
  v_result        jsonb := '{}'::jsonb;
  v_month         int;
  v_prefix        text;
  v_row           record;
  v_income        numeric(14,2);
  v_expense       numeric(14,2);
  v_income_cat    jsonb;
  v_expense_cat   jsonb;
  v_current_year  int := extract(year  from now());
  v_current_month int := extract(month from now());
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_year > v_current_year then
    return v_result;
  end if;

  for v_month in 1..12 loop
    exit when (p_year = v_current_year and v_month > v_current_month);

    select * into v_row from monthly_summaries
      where user_id = v_user and year = p_year and month = v_month;

    if found and not (p_year = v_current_year and v_month = v_current_month) then
      v_result := v_result || jsonb_build_object(v_month::text, jsonb_build_object(
        'total_income',        v_row.total_income,
        'total_expense',       v_row.total_expense,
        'income_by_category',  v_row.income_by_category,
        'expense_by_category', v_row.expense_by_category
      ));
    else
      v_prefix := to_char(make_date(p_year, v_month, 1), 'YYYY-MM');

      select coalesce(sum(amount) filter (where type = 'income'),  0),
             coalesce(sum(amount) filter (where type = 'expense'), 0)
        into v_income, v_expense
        from transactions
        where user_id = v_user and date like v_prefix || '%';

      select coalesce(jsonb_object_agg(category, cat_total), '{}'::jsonb) into v_income_cat
        from (
          select category, sum(amount) as cat_total from transactions
          where user_id = v_user and type = 'income' and date like v_prefix || '%'
          group by category
        ) t;

      select coalesce(jsonb_object_agg(category, cat_total), '{}'::jsonb) into v_expense_cat
        from (
          select category, sum(amount) as cat_total from transactions
          where user_id = v_user and type = 'expense' and date like v_prefix || '%'
          group by category
        ) t;

      v_result := v_result || jsonb_build_object(v_month::text, jsonb_build_object(
        'total_income',        v_income,
        'total_expense',       v_expense,
        'income_by_category',  v_income_cat,
        'expense_by_category', v_expense_cat
      ));
    end if;
  end loop;

  return v_result;
end;
$$;

grant execute on function get_year_finance_overview(int) to authenticated;

-- ================================================================
--  INDEXES for performance
-- ================================================================
create index if not exists idx_transactions_user_date       on transactions (user_id, date);
create index if not exists idx_split_bill_people_user        on split_bill_people (user_id);
create index if not exists idx_split_bill_expenses_user      on split_bill_expenses (user_id);
create index if not exists idx_todos_user_date               on todos (user_id, date);
create index if not exists idx_habits_user                   on habits (user_id);
create index if not exists idx_habit_completions_habit       on habit_completions (habit_id);
create index if not exists idx_notes_user                    on notes (user_id);
create index if not exists idx_savings_user                  on savings (user_id);
create index if not exists idx_tx_cats_user                  on transaction_categories (user_id);
create index if not exists idx_todo_cats_user                on todo_categories (user_id);
create index if not exists idx_saving_cats_user              on saving_categories (user_id);
create index if not exists idx_monthly_summaries_user_year    on monthly_summaries (user_id, year);