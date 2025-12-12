# CPE334_Software_Engieering_Project
# 📅 Activity Management System

A web-based activity management system built with modern web technologies. This platform handles student activities, event management, and role-based access control for Students, Activity Makers, and Admins.

## 🚀 Tech Stack

**Frontend**
* **Framework:** React 19 (Vite)
* **Routing:** React Router DOM v6
* **Language:** TypeScript
* **Styling:** (Add your styling lib here e.g., TailwindCSS, CSS Modules)

**Backend**
* **Runtime:** [Bun](https://bun.sh/)
* **Framework:** [ElysiaJS](https://elysiajs.com/)
* **Database:** Supabase (PostgreSQL)
* **Auth:** Supabase Auth
* **Email:** Resend

---

## 📂 Project Structure

This project follows a monorepo-style structure:

```text
/
├── backend/    # API Server (Bun + Elysia)
├── frontend/   # Client Application (React + Vite)
└── ...

🛠️ Installation & Setup
Prerequisites
Bun (v1.0 or later) is required for the backend.

Node.js (LTS) is recommended for the frontend (or you can use Bun).

1. Database Setup (Supabase)
  1.Create a new project on Supabase.

  2.Go to the SQL Editor in your Supabase dashboard.

  3.Run the following SQL script to create tables and relations:

2. Environment Variables
Create .env files in both backend and frontend folders.

Backend (backend/.env):
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
RESEND_API_KEY="re_..."

Frontend (frontend/.env):
VITE_SUPABASE_URL="https://[REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"

3. Running the Project
Backend (Bun + Elysia)

cd backend
bun install
bun run dev

Server will start at http://localhost:3000

Frontend (React + Vite)
Open a new terminal:

cd frontend
npm install
npm run dev

นี่คือร่าง README.md แบบละเอียดและเป็นมืออาชีพ (Professional Standard) โดยเขียนเป็นภาษาอังกฤษ (ซึ่งเป็นมาตรฐานของ GitHub) แต่ผมปรับเนื้อหาให้ตรงกับ Tech Stack ของคุณ (Bun + Elysia / React + Vite) และเน้นเรื่อง Database Schema กับ Role-Based Access Control (RBAC) ตามที่คุณระบุมาเป๊ะๆ ครับ

คุณสามารถ Copy โค้ดด้านล่างนี้ไปสร้างไฟล์ README.md ที่โฟลเดอร์นอกสุด (Root) ได้เลยครับ

📄 ตัวอย่างไฟล์ README.md
Markdown

# 📅 Activity Management System

A web-based activity management system built with modern web technologies. This platform handles student activities, event management, and role-based access control for Students, Activity Makers, and Admins.

## 🚀 Tech Stack

**Frontend**
* **Framework:** React 19 (Vite)
* **Routing:** React Router DOM v6
* **Language:** TypeScript
* **Styling:** (Add your styling lib here e.g., TailwindCSS, CSS Modules)

**Backend**
* **Runtime:** [Bun](https://bun.sh/)
* **Framework:** [ElysiaJS](https://elysiajs.com/)
* **Database:** Supabase (PostgreSQL)
* **Auth:** Supabase Auth
* **Email:** Resend

---

## 📂 Project Structure

This project follows a monorepo-style structure:

```text
/
├── backend/    # API Server (Bun + Elysia)
├── frontend/   # Client Application (React + Vite)
└── ...
🛠️ Installation & Setup
Prerequisites
Bun (v1.0 or later) is required for the backend.

Node.js (LTS) is recommended for the frontend (or you can use Bun).

1. Database Setup (Supabase)
Create a new project on Supabase.

Go to the SQL Editor in your Supabase dashboard.

Run the following SQL script to create tables and relations:

<details> <summary>Click to view SQL Schema</summary>

SQL

-- Activity & Events
CREATE TABLE public.Activity (
  id integer NOT NULL DEFAULT nextval('"Activity_id_seq"'::regclass),
  name character varying,
  description text,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  student_id uuid,
  type_id bigint,
  all_day boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT Activity_pkey PRIMARY KEY (id),
  CONSTRAINT activity_student_fk FOREIGN KEY (student_id) REFERENCES public.Student(user_id),
  CONSTRAINT Activity_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.ActivityType(id),
  CONSTRAINT activity_created_by_fk FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Users & Roles
CREATE TABLE public.Student (
  user_id uuid NOT NULL,
  student_id character varying UNIQUE CHECK (student_id::text ~ '^[0-9]{11}$'::text),
  department character varying,
  phone character,
  CONSTRAINT Student_pkey PRIMARY KEY (user_id),
  CONSTRAINT student_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.Admin (
  user_id uuid NOT NULL,
  CONSTRAINT Admin_pkey PRIMARY KEY (user_id),
  CONSTRAINT admin_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.ActivityMaker (
  user_id uuid NOT NULL,
  name character varying,
  description text,
  CONSTRAINT ActivityMaker_pkey PRIMARY KEY (user_id),
  CONSTRAINT activity_maker_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- (Include other tables: ActivityType, ActivityRequest, JoinEvent here as needed)
</details>

2. Environment Variables
Create .env files in both backend and frontend folders.

Backend (backend/.env):

ข้อมูลโค้ด

DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
RESEND_API_KEY="re_..."
Frontend (frontend/.env):

ข้อมูลโค้ด

VITE_SUPABASE_URL="https://[REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
3. Running the Project
Backend (Bun + Elysia)
Bash

cd backend
bun install
bun run dev
Server will start at http://localhost:3000

Frontend (React + Vite)
Open a new terminal:

Bash

cd frontend
npm install
npm run dev
Client will start at http://localhost:5173

🔐 Authentication & Role Management
This system uses Supabase Auth (auth.users) combined with custom tables for Role-Based Access Control (RBAC).

1. Student Access
Sign Up: Students can sign up normally via the login page.
Access: Once logged in, they can access student-specific features immediately.

2. Admin Access (Important!) ⚠️
  Admin access is Restricted. A user cannot simply "sign up" as an admin. To grant Admin privileges:
    1.User must sign up via the app first (to generate a UUID in auth.users).
    2.Manual Step: A database administrator must manually insert the user's UUID into the public.Admin table.
    3.Without this entry, the user will be denied access to the Admin Dashboard.

3. Activity Maker Access
Similar to Admins, users wishing to organize activities must have their UUID present in the public.ActivityMaker table. This is granted by an Admin.

🔧 Troubleshooting
If you encounter issues with dependencies or version mismatches (especially after pulling new code), please perform a Clean Install.
