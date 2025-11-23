# FondSmena Intranet Portal — Project Memory

## Project Overview

Corporate intranet portal for FondSmena organization. Full-stack monorepo with React frontend and Django REST backend.

## Technology Stack

### Frontend (`/frontend`)
- **Framework:** React 18.2 + TypeScript 5.4
- **Build:** Vite 5.2
- **UI Framework:** Carbon Design System (`@carbon/react` 1.96, `@carbon/icons-react` 11.70)
- **State Management:** Zustand 4.5.2 (auth store with localStorage persistence)
- **Data Fetching:** TanStack React Query 5.28 + Axios
- **Routing:** React Router 6.22
- **Forms:** React Hook Form 7.51 + Zod validation
- **Styling:** Tailwind CSS 3.4 + SCSS
- **Testing:** Vitest 3.2, Testing Library

### Backend (`/backend`)
- **Framework:** Django 5.0 + Django REST Framework 3.15
- **Auth:** JWT via djangorestframework-simplejwt 5.3
- **Database:** PostgreSQL 16
- **Cache/Queue:** Redis 7 + Celery 5.3 + Django Celery Beat 2.5
- **API Docs:** drf-spectacular 0.27
- **Server:** Gunicorn 22.0

### Infrastructure
- **Containerization:** Docker Compose
- **Reverse Proxy:** Nginx
- **Timezone:** Europe/Moscow
- **Language:** Russian (ru-ru)

## Project Structure

```
fond-intra/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # 19 components
│   │   │   ├── ui/              # Button, Input, Card, Avatar, Toaster
│   │   │   ├── layout/          # MainLayout, AuthLayout, Header, Sidebar
│   │   │   └── features/        # achievements/, notifications/, skills/
│   │   ├── pages/               # 27 pages
│   │   │   ├── auth/            # Login, ForgotPassword, ResetPassword, ChangePassword
│   │   │   ├── dashboard/       # DashboardPage
│   │   │   ├── profile/         # Profile, ProfileEdit, ProfileSkills
│   │   │   ├── employees/       # EmployeesPage, EmployeeDetailPage
│   │   │   ├── achievements/    # AchievementsPage
│   │   │   ├── news/            # News, NewsDetail, NewsCreate, NewsEdit
│   │   │   ├── organization/    # OrganizationPage
│   │   │   ├── skills/          # SkillsCatalogPage
│   │   │   ├── notifications/   # NotificationsPage, NotificationSettingsPage
│   │   │   └── admin/           # 7 admin pages
│   │   ├── api/                 # API client + endpoints
│   │   ├── store/               # authStore.ts (Zustand)
│   │   └── styles/              # carbon.scss, globals.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── apps/                    # 8 Django apps
│   │   ├── accounts/            # User model, auth, profiles, statuses
│   │   ├── organization/        # Department, Position
│   │   ├── roles/               # RBAC - Role, Permission
│   │   ├── skills/              # SkillCategory, Skill, UserSkill
│   │   ├── achievements/        # Achievement, AchievementAward
│   │   ├── news/                # News, Comment, Reaction, NewsAttachment
│   │   ├── notifications/       # Notification, NotificationSettings
│   │   └── audit/               # AuditLog
│   ├── config/
│   │   ├── settings/            # base.py, development.py, production.py, test.py
│   │   ├── urls.py
│   │   ├── api_urls.py          # /api/v1/ routes
│   │   └── celery.py
│   ├── core/                    # Shared utilities, pagination
│   └── requirements.txt
│
├── nginx/                       # Nginx configuration
├── docker-compose.prod.yml      # Production deployment
└── CLAUDE.md                    # This file
```

## Database Models

### accounts.User (Custom User Model)
- Email-based authentication (email as USERNAME_FIELD)
- Fields: email, first_name, last_name, patronymic, avatar, phone_work, phone_personal, telegram, birth_date, hire_date
- Relations: department (FK), position (FK), manager (self-FK), roles (M2M)
- Properties: full_name, current_status
- Methods: has_permission(codename), has_any_permission(codenames)

### accounts.UserStatus
- Tracks: vacation, sick_leave, business_trip, remote, maternity
- Fields: user, status, start_date, end_date, comment, created_by

### organization.Department
- Hierarchical (self-referencing parent FK)
- Fields: name, description, parent, head (FK to User), order
- Methods: get_ancestors(), get_descendants(), get_full_path()

### organization.Position
- Fields: name, description, level

### roles.Permission
- Categories: users, organization, achievements, news, comments, roles, audit
- Fields: codename (unique), name, description, category

### roles.Role
- Fields: name (unique), description, permissions (M2M), is_system
- Default roles: Employee, HR, Content Manager, Achievement Admin, Admin

### skills.SkillCategory, Skill, UserSkill
- Proficiency levels: beginner, intermediate, advanced, expert

### achievements.Achievement, AchievementAward
- Categories: professional, corporate, social, special
- Icon field stores emoji

### news.News, Comment, Reaction, NewsAttachment, Tag
- News has status field: draft, scheduled, published
- News has publish_at for scheduled publishing
- NewsAttachment has: thumbnail, order, is_cover fields
- Reactions: like, celebrate, support, insightful
- Comments support nesting via parent FK
- Comments have get_mentioned_users() method for @mentions
- Tags: name, slug, color (M2M to News)

### notifications.Notification, NotificationSettings
- Types: birthday, achievement, news, comment, reaction, mention, system

### audit.AuditLog
- Actions: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ARCHIVE, RESTORE, PASSWORD_CHANGE, PASSWORD_RESET
- Stores old_values/new_values as JSON

## API Endpoints (v1)

Base URL: `/api/v1/`

### Authentication
- POST `/auth/login/` - JWT login
- POST `/auth/logout/` - Blacklist token
- POST `/auth/token/refresh/` - Refresh access token
- POST `/auth/password/change/` - Change password
- POST `/auth/password/reset/` - Request reset
- POST `/auth/password/reset/confirm/` - Confirm reset

### Users
- GET/POST `/users/` - List/create users
- GET/PATCH `/users/{id}/` - User detail/update
- POST `/users/{id}/archive/` - Archive user
- GET `/users/me/` - Current user
- GET/POST `/users/{id}/statuses/` - User statuses
- GET/POST `/users/{id}/skills/` - User skills

### Organization
- GET/POST `/organization/departments/`
- GET `/organization/positions/`

### Skills
- GET `/skills/categories/`
- GET `/skills/`

### Achievements
- GET `/achievements/`
- GET `/users/{id}/achievements/`
- POST `/achievements/{id}/award/`

### News
- GET/POST `/news/`
- GET/PATCH/DELETE `/news/{id}/`
- POST `/news/{id}/comments/`
- POST `/news/{id}/reactions/`

### Notifications
- GET `/notifications/`
- PATCH `/notifications/{id}/mark-as-read/`
- POST `/notifications/mark-all-as-read/`
- GET `/notifications/unread-count/`
- GET/PATCH `/notifications/settings/`

### Admin
- CRUD `/admin/roles/`
- GET `/admin/audit/`

## RBAC Permissions

14 permission categories with codenames:
- users: view_all, view_private, edit_own, edit_all, create, archive, manage_statuses
- organization: view, manage
- achievements: view, award, manage
- news: view, create, edit_own, edit_all, delete_own, delete_all, pin
- comments: create, edit_own, delete_all
- roles: view, manage
- audit: view, export

## Carbon Design System Integration

### Theme
- Using `g10` theme (light gray) in `main.tsx`
- Theme wrapper: `<Theme theme="g10">`

### Components in Use
- Navigation: Header, HeaderName, HeaderGlobalBar, HeaderGlobalAction, SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem
- Forms: Search, TextInput, Select, SelectItem, TextArea, Checkbox, Button
- Utilities: SkipToContent, Loading

### Styling
- Main styles: `/frontend/src/styles/carbon.scss`
- CSS variables: `--cds-background`, `--cds-layer-01`, `--cds-text-secondary`, `--cds-border-subtle-01`, etc.
- Custom classes: `.page-header`, `.stat-tile`, `.list-item`, `.auth-container`, `.search-results`, `.user-menu`
- Grid: `.dashboard-grid`, `.dashboard-cards` (custom, not Carbon Grid)

### Icons
- Package: `@carbon/icons-react`
- Used: Home, User, UserMultiple, Trophy, Document, Building, Settings, Notification, Logout, Password, Menu, Close, Edit, Archive, Add, TrashCan

## New UI Components

### ImageGallery (`frontend/src/components/ui/ImageGallery.tsx`)
- Grid display of images with thumbnails
- Lightbox for fullscreen viewing
- Keyboard navigation: ← → Esc
- Props: `images: NewsAttachment[]`

### MentionInput (`frontend/src/components/ui/MentionInput.tsx`)
- Text input with @mention autocomplete
- Debounced user search (200ms)
- Keyboard navigation: ↑↓ Enter Tab Esc
- Format: `@"Full Name"`
- Props: `id, value, onChange, placeholder, size, disabled`

### RichTextEditor (`frontend/src/components/ui/RichTextEditor.tsx`)
- Editor.js based WYSIWYG editor
- Tools: Header, List, Quote, Delimiter, Image
- Stores JSON format (Editor.js blocks)
- Props: `value, onChange, placeholder`

### EmptyState (`frontend/src/components/ui/EmptyState.tsx`)
- Empty list placeholder with icon, title, description, action
- Sizes: sm, md, lg
- Carbon icons support

## Known Issues & Technical Debt

1. ~~**Mixed UI Libraries**~~ - Radix UI removed, using Carbon only ✅
2. **Inline Styles** - MainLayout.tsx has many inline styles instead of Carbon classes
3. **Custom Dropdowns** - `.user-menu`, `.search-results` implemented manually; should use Carbon OverflowMenu/ComboBox
4. ~~**Grid System**~~ - Main pages using Carbon Grid ✅
5. **DataTable** - Admin tables should use Carbon DataTable
6. **Notifications** - Should use Carbon ToastNotification instead of custom toaster
7. **CI/CD** - `.github/` directory is empty, no workflows configured

## Development Commands

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run test         # Run tests
npm run test:run     # Run tests once
```

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
export DJANGO_SETTINGS_MODULE=config.settings.development
python manage.py migrate
python manage.py init_roles    # Initialize default roles
python manage.py runserver
```

### Docker (Production)
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Backend
- DATABASE_URL - PostgreSQL connection string
- REDIS_URL - Redis connection string
- SECRET_KEY - Django secret key
- DEBUG - Debug mode (True/False)
- ALLOWED_HOSTS - Comma-separated hosts
- CORS_ALLOWED_ORIGINS - Frontend URL

### Frontend
- VITE_API_URL - Backend API base URL (proxied in dev)

## Git Workflow

- Main branch: `main`
- Recent commits focus on: Skills module, Carbon Design System migration, bug fixes

## Recommendations for Future Development

1. **Unify UI Components** - Remove Radix UI, use Carbon exclusively
2. **Implement Carbon Grid** - Replace custom grid CSS with Carbon Grid system
3. **Add Dark Theme** - Consider `g100` theme option
4. **Use Carbon DataTable** - For all admin panel tables
5. **Add Carbon Notifications** - ToastNotification, InlineNotification
6. **Setup CI/CD** - Add GitHub Actions for tests, linting, deployment
7. **Expand Tests** - Add more unit and integration tests
8. **API Documentation** - Enable drf-spectacular UI endpoint
