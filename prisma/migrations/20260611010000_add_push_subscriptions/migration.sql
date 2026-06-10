create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint varchar(500) not null unique,
  p256dh varchar(255) not null,
  auth varchar(255) not null,
  user_agent varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);
create trigger trg_push_subscriptions_updated_at before update on push_subscriptions for each row execute function set_updated_at();
