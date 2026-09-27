import { neon } from '@neondatabase/serverless';
export const configured=Boolean(process.env.DATABASE_URL);
export const sql=configured?neon(process.env.DATABASE_URL):null;
export async function ensureSchema(){
  if(!sql)return false;
  await sql.query("create table if not exists employees(id uuid primary key default gen_random_uuid(),name varchar(120) not null,role varchar(120) not null default 'Team member',photo_data text,active boolean not null default true,created_at timestamptz not null default now())");
  await sql.query("create table if not exists attendance(id uuid primary key default gen_random_uuid(),employee_id uuid not null references employees(id) on delete cascade,attendance_date date not null,status varchar(20) not null check(status in('present','absent','half_day','leave')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(employee_id,attendance_date))");
  await sql.query("create index if not exists attendance_date_idx on attendance(attendance_date)");
  await sql.query("create index if not exists attendance_employee_date_idx on attendance(employee_id,attendance_date)");
  return true;
}