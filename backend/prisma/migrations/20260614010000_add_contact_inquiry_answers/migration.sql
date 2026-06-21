alter table contact_inquiries
  add column if not exists answer_body text,
  add column if not exists answered_by uuid references users(id) on delete set null,
  add column if not exists answered_at timestamptz;

create index if not exists contact_inquiries_status_created_at_idx on contact_inquiries(status, created_at);
create index if not exists contact_inquiries_answered_by_idx on contact_inquiries(answered_by);
