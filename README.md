# Task Management System - Backend API

A robust RESTful API built with **NestJS**, **TypeORM**, and **MySQL** that powers the Task/Todo Management application. The system provides secure user authentication, complete task lifecycle management with pagination, filtering, searching, and sorting, user-scoped data isolation, and real-time dashboard analytics.

---

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js framework with TypeScript)
- **Database**: [MySQL](https://www.mysql.com/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Authentication**: JWT (`@nestjs/jwt`), `bcrypt`
- **Validation**: `class-validator`, `class-transformer`

---

## 🚀 Features

### 1. Authentication & Authorization (`/auth`)
- **User Registration (`POST /auth/signup`)**:
  - Securely registers new users with full name, unique username, and password.
  - Password strength validation: minimum 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.
  - Salted password hashing with `bcrypt` (12 rounds).
  - Handles duplicate username conflicts.
- **User Login (`POST /auth/signin`)**:
  - Verifies credentials against hashed passwords.
  - Issues signed JWT access tokens containing user payload (`sub`, `email`).
- **Global Auth Guard (`AuthguardGuard`)**:
  - Protects all endpoints by default with Bearer token authentication.
  - Supports route-level exemption using a custom `@Public()` decorator.
- **User Data Isolation**:
  - Multi-tenant data segregation: all task queries, updates, aggregations, and deletions strictly operate on the authenticated user's ID.

### 2. Task Management (`/tasks`)
- **Create Task (`POST /tasks`)**:
  - Add tasks with title, optional description, and priority (`low`, `medium`, `high`). Automatically attached to the current user.
- **Fetch All Tasks with Advanced Filtering (`GET /tasks`)**:
  - **Pagination**: Configurable `page` (default: 1) and `limit` (default: 10).
  - **Status Filter**: Filter by `pending`, `inprogress`, or `completed`.
  - **Priority Filter**: Filter by `low`, `medium`, or `high`.
  - **Search**: Full text search across task `title` and `description`.
  - **Sorting**: Dynamically sort by `createdAt`, `updatedAt`, `title`, `priority`, or `status` in `ASC` or `DESC` order.
- **Fetch Task by ID (`GET /tasks/:id`)**:
  - Fetch detailed information for a single task owned by the user.
- **Update Task (`PATCH /tasks/:id`)**:
  - Partial updates for task title, description, priority, and status.
- **Soft Deletion (`DELETE /tasks/:id`)**:
  - Safe removal using TypeORM's `softRemove`, populating `deletedAt` without permanently purging data from the database.

### 3. Dashboard & Metrics (`GET /tasks/dashboard/stats`)
- Real-time aggregated statistics for the logged-in user:
  - **Total Active Tasks**
  - **Status Breakdown**: Count of `pending`, `inProgress`, and `completed` tasks.
  - **Priority Breakdown**: Count of `high`, `medium`, and `low` priority tasks.

---

## 🗄 Database Entities & Schema

### 1. User Entity (`users`)
Located at `src/user/entities/user.entity.ts`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-Increment | Unique user identifier |
| `name` | `VARCHAR(100)` | Not Null | User's full display name |
| `username` | `VARCHAR(50)` | Not Null, Unique | Unique username for sign-in |
| `password` | `VARCHAR` | Not Null | Hashed password string |
| `createdAt` | `DATETIME` | Auto-generated (`@CreateDateColumn`) | Account registration timestamp |
| `updatedAt` | `DATETIME` | Auto-generated (`@UpdateDateColumn`) | Account update timestamp |
| `tasks` | Relation | `OneToMany -> Task` | One-to-many relationship with tasks |

### 2. Task Entity (`tasks`)
Located at `src/task/entities/task.entity.ts`

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-Increment | Unique task identifier |
| `title` | `VARCHAR(150)` | Not Null | Title of the task |
| `description` | `TEXT` | Nullable | Detailed task description |
| `status` | `ENUM` | Default: `'pending'` | `'pending'`, `'inprogress'`, `'completed'` |
| `priority` | `ENUM` | Default: `'medium'` | `'low'`, `'medium'`, `'high'` |
| `userId` | `INT` | Foreign Key (`ManyToOne -> User`) | Owner of the task |
| `createdAt` | `DATETIME` | Auto-generated (`@CreateDateColumn`) | Creation timestamp |
| `updatedAt` | `DATETIME` | Auto-generated (`@UpdateDateColumn`) | Last modification timestamp |
| `deletedAt` | `DATETIME` | Nullable (`@DeleteDateColumn`) | Soft delete timestamp |

---

## 📡 API Endpoints Reference

### Authentication
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/signup` | No | Register a new user |
| `POST` | `/auth/signin` | No | Log in and receive a JWT access token |

### Tasks
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/tasks` | Yes | Create a new task |
| `GET` | `/tasks` | Yes | Fetch tasks (supports filter, sort, search, pagination) |
| `GET` | `/tasks/dashboard/stats` | Yes | Get aggregated dashboard task metrics |
| `GET` | `/tasks/:id` | Yes | Fetch a single task by ID |
| `PATCH` | `/tasks/:id` | Yes | Update a task by ID |
| `DELETE` | `/tasks/:id` | Yes | Soft-delete a task by ID |

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` root directory with the following configuration:

```env
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_TYPE=mysql
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=todo_app

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

---

## 💻 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run database**:
   Ensure MySQL is running and the database specified in `.env` exists.

3. **Start the application**:
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

4. **Testing & Linting**:
   ```bash
   # Unit tests
   npm run test

   # Code linting
   npm run lint
   ```
