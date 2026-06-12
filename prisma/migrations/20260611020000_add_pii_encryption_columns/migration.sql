alter table users drop constraint if exists users_email_key;
alter table users alter column name type varchar(1000);
alter table users alter column email type varchar(1000);
alter table users alter column phone type varchar(1000);
alter table users add column if not exists email_hash varchar(128);
create unique index if not exists users_email_hash_key on users(email_hash);
create index if not exists idx_users_email_hash on users(email_hash);

alter table resumes alter column original_filename type varchar(1000);

alter table privacy_policy_consents alter column ip_address type varchar(1000);
alter table privacy_policy_consents alter column user_agent type varchar(1000);

alter table push_subscriptions drop constraint if exists push_subscriptions_endpoint_key;
alter table push_subscriptions alter column endpoint type varchar(1000);
alter table push_subscriptions alter column p256dh type varchar(1000);
alter table push_subscriptions alter column auth type varchar(1000);
alter table push_subscriptions alter column user_agent type varchar(1000);
alter table push_subscriptions add column if not exists endpoint_hash varchar(128);
create unique index if not exists push_subscriptions_endpoint_hash_key on push_subscriptions(endpoint_hash);
create index if not exists idx_push_subscriptions_endpoint_hash on push_subscriptions(endpoint_hash);
