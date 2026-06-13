create table contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  role user_role,
  inquiry_type varchar(100) not null,
  name varchar(1000) not null,
  email varchar(1000) not null,
  phone varchar(1000),
  subject varchar(1000) not null,
  body text not null,
  status varchar(50) not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_inquiries_user_id_created_at_idx on contact_inquiries(user_id, created_at);
create trigger trg_contact_inquiries_updated_at before update on contact_inquiries for each row execute function set_updated_at();
