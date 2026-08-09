alter table jobs
  add column external_source varchar(100),
  add column external_id varchar(255);

create index idx_jobs_external_source on jobs(external_source);
create unique index jobs_external_source_external_id_key on jobs(external_source, external_id);
