create extension if not exists "pgcrypto";

create type user_role as enum ('freelancer', 'sales');
create type remote_type as enum ('full_remote', 'hybrid', 'onsite');
create type availability_status as enum ('ready', 'scheduled', 'paused');
create type skill_category as enum ('language', 'database', 'framework', 'cloud', 'tool', 'other');
create type stream_type as enum ('end_direct', 'prime', 'secondary', 'other');
create type job_skill_requirement_type as enum ('required', 'nice');
create type application_status as enum ('screening', 'meeting_pending', 'contracted', 'rejected');
create type meeting_status as enum ('candidate', 'confirmed', 'reschedule');
create type message_type as enum ('chat', 'scout', 'alive_check', 'system');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table users (
  id uuid primary key default gen_random_uuid(),
  role user_role not null,
  name varchar(255) not null,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  phone varchar(50),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table freelancer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  public_code varchar(100) not null unique,
  role_title varchar(255),
  years_experience numeric(4,1),
  desired_rate integer,
  start_date date,
  work_rate varchar(50),
  remote_type remote_type,
  availability_status availability_status,
  availability_note varchar(255),
  last_updated_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (desired_rate is null or desired_rate >= 0),
  check (years_experience is null or years_experience >= 0)
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  category skill_category not null default 'other',
  created_at timestamptz not null default now(),
  unique (name, category)
);

create table freelancer_skills (
  freelancer_profile_id uuid not null references freelancer_profiles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete restrict,
  years_experience numeric(4,1),
  level varchar(50),
  created_at timestamptz not null default now(),
  primary key (freelancer_profile_id, skill_id),
  check (years_experience is null or years_experience >= 0)
);

create table resumes (
  id uuid primary key default gen_random_uuid(),
  freelancer_profile_id uuid not null references freelancer_profiles(id) on delete cascade,
  original_filename varchar(255) not null,
  mime_type varchar(100),
  file_size_bytes integer,
  storage_key varchar(500) not null,
  is_latest boolean not null default true,
  uploaded_at timestamptz not null default now(),
  check (file_size_bytes is null or file_size_bytes >= 0)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  title varchar(255) not null,
  summary text,
  rate_min integer not null default 0,
  rate_max integer not null default 0,
  margin_rate numeric(5,2) not null default 0,
  stream_type stream_type not null,
  remote_type remote_type not null,
  is_pinned boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rate_min >= 0),
  check (rate_max >= rate_min),
  check (margin_rate >= 0 and margin_rate <= 100)
);

create table job_skills (
  job_id uuid not null references jobs(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete restrict,
  requirement_type job_skill_requirement_type not null,
  created_at timestamptz not null default now(),
  primary key (job_id, skill_id, requirement_type)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  freelancer_profile_id uuid not null references freelancer_profiles(id) on delete cascade,
  status application_status not null default 'screening',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, freelancer_profile_id)
);

create table application_status_histories (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  from_status application_status,
  to_status application_status not null,
  changed_by uuid references users(id) on delete set null,
  changed_at timestamptz not null default now(),
  note text
);

create table meeting_requests (
  id uuid primary key default gen_random_uuid(),
  freelancer_profile_id uuid not null references freelancer_profiles(id) on delete cascade,
  application_id uuid references applications(id) on delete set null,
  candidate_at timestamptz not null,
  status meeting_status not null default 'candidate',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references users(id) on delete cascade,
  receiver_user_id uuid references users(id) on delete set null,
  freelancer_profile_id uuid references freelancer_profiles(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  message_type message_type not null default 'chat',
  body text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create table alive_check_batches (
  id uuid primary key default gen_random_uuid(),
  executed_by uuid references users(id) on delete set null,
  target_count integer not null default 0,
  executed_at timestamptz not null default now(),
  check (target_count >= 0)
);

create table alive_check_targets (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references alive_check_batches(id) on delete cascade,
  freelancer_profile_id uuid not null references freelancer_profiles(id) on delete cascade,
  status varchar(50) not null default 'sent',
  sent_at timestamptz not null default now(),
  responded_at timestamptz
);

create table privacy_policy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  policy_version varchar(50) not null,
  accepted_at timestamptz not null default now(),
  ip_address varchar(64),
  user_agent varchar(500),
  unique (user_id, policy_version)
);

create index idx_users_role_active on users(role, is_active);
create index idx_freelancer_profiles_availability on freelancer_profiles(availability_status);
create index idx_freelancer_profiles_remote on freelancer_profiles(remote_type);
create index idx_resumes_latest on resumes(freelancer_profile_id, is_latest);
create index idx_jobs_active_pinned on jobs(is_active, is_pinned);
create index idx_jobs_remote_type on jobs(remote_type);
create index idx_jobs_stream_type on jobs(stream_type);
create index idx_applications_status on applications(status);
create index idx_application_status_histories_application on application_status_histories(application_id, changed_at);
create index idx_meeting_requests_profile_candidate on meeting_requests(freelancer_profile_id, candidate_at);
create index idx_messages_profile_sent on messages(freelancer_profile_id, sent_at);
create index idx_messages_sender_sent on messages(sender_user_id, sent_at);
create index idx_alive_check_targets_batch on alive_check_targets(batch_id);
create index idx_alive_check_targets_profile on alive_check_targets(freelancer_profile_id);
create index idx_privacy_policy_consents_user on privacy_policy_consents(user_id, accepted_at);

create trigger trg_users_updated_at before update on users for each row execute function set_updated_at();
create trigger trg_freelancer_profiles_updated_at before update on freelancer_profiles for each row execute function set_updated_at();
create trigger trg_clients_updated_at before update on clients for each row execute function set_updated_at();
create trigger trg_jobs_updated_at before update on jobs for each row execute function set_updated_at();
create trigger trg_applications_updated_at before update on applications for each row execute function set_updated_at();
create trigger trg_meeting_requests_updated_at before update on meeting_requests for each row execute function set_updated_at();
