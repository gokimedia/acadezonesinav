-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create departments table first (no dependencies)
create table if not exists departments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create users table (no dependencies)
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text,
  surname text,
  phone text,
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create students table (no dependencies)
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  surname text not null,
  phone text,
  email text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exams table (depends on departments and users)
create table if not exists exams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  exam_date timestamp with time zone,
  duration integer, -- in minutes
  location text,
  department_id uuid references departments(id) on delete set null,
  is_active boolean default true,
  created_by uuid references users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exam_students table (depends on exams and students)
create table if not exists exam_students (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text default 'registered', -- registered, present, absent
  score numeric(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (exam_id, student_id)
);

-- Create questions table (depends on exams)
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid not null references exams(id) on delete cascade,
  question_text text not null,
  question_type text not null, -- multiple_choice, open_ended, etc.
  points numeric(5,2) default 1.0,
  options jsonb,
  correct_answer text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create answers table (depends on questions and students)
create table if not exists answers (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid not null references questions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_earned numeric(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (question_id, student_id)
);

-- Enable row level security
alter table departments enable row level security;
alter table users enable row level security;
alter table students enable row level security;
alter table exams enable row level security;
alter table exam_students enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;

-- Create RLS policies

-- Departments policies
create policy "Anyone can view departments"
  on departments for select
  to authenticated
  using (true);

-- Users policies
create policy "Users can view their own data"
  on users for select
  using (auth.uid() = id);

-- Exams policies
DROP POLICY IF EXISTS "Anyone can view exams" ON exams;
DROP POLICY IF EXISTS "Only creators can modify exams" ON exams;

CREATE POLICY "Anyone can view exams"
ON exams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create exams"
ON exams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Only creators can update exams"
ON exams FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete exams"
ON exams FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Students policies
create policy "Anyone can view students"
  on students for select
  to authenticated
  using (true);

create policy "Anyone can insert students"
  on students for insert
  to authenticated
  with check (true);

create policy "Anyone can update students"
  on students for update
  to authenticated
  using (true);

create policy "Anyone can delete students"
  on students for delete
  to authenticated
  using (true);

-- Exam students policies
create policy "Anyone can view exam_students"
  on exam_students for select
  to authenticated
  using (true);

create policy "Anyone can insert exam_students"
  on exam_students for insert
  to authenticated
  with check (true);

create policy "Anyone can update exam_students"
  on exam_students for update
  to authenticated
  using (true);

create policy "Anyone can delete exam_students"
  on exam_students for delete
  to authenticated
  using (true);

-- Questions policies
create policy "Anyone can view questions"
  on questions for select
  to authenticated
  using (true);

create policy "Only exam creators can modify questions"
  on questions for all
  using (
    exists (
      select 1 from exams
      where exams.id = questions.exam_id
      and exams.created_by = auth.uid()
    )
  );

-- Answers policies
create policy "Students can view their own answers"
  on answers for select
  to authenticated
  using (student_id = auth.uid());

-- Create functions
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger handle_updated_at
  before update on departments
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on users
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on students
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on exams
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on exam_students
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on questions
  for each row
  execute function handle_updated_at();

create trigger handle_updated_at
  before update on answers
  for each row
  execute function handle_updated_at();
