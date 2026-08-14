alter table jobs
  add column external_dedupe_key varchar(255),
  add column external_received_at timestamptz,
  add column external_received_at_ms bigint,
  add column unit_price varchar(255),
  add column settlement_lower varchar(100),
  add column settlement_upper varchar(100),
  add column location text,
  add column start_period varchar(255),
  add column remote_ratio varchar(255),
  add column foreigner_availability varchar(255),
  add column age_limit varchar(100),
  add column external_created_at timestamptz,
  add column external_updated_at timestamptz;

create index idx_jobs_external_dedupe_key on jobs(external_dedupe_key);
