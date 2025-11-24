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
│   │   ├── pages/               # 38+ pages
│   │   │   ├── auth/            # Login, ForgotPassword, ResetPassword, ChangePassword
│   │   │   ├── dashboard/       # DashboardPage
│   │   │   ├── profile/         # Profile, ProfileEdit, ProfileSkills
│   │   │   ├── employees/       # EmployeesPage, EmployeeDetailPage
│   │   │   ├── achievements/    # AchievementsPage
│   │   │   ├── news/            # News, NewsDetail, NewsCreate, NewsEdit, NewsDrafts
│   │   │   ├── organization/    # OrganizationPage
│   │   │   ├── skills/          # SkillsCatalogPage
│   │   │   ├── notifications/   # NotificationsPage, NotificationSettingsPage
│   │   │   ├── kudos/           # KudosPage
│   │   │   ├── surveys/         # SurveysPage, SurveyDetailPage, SurveyResultsPage
│   │   │   ├── ideas/           # IdeasPage, IdeaDetailPage
│   │   │   ├── faq/             # FAQPage
│   │   │   ├── classifieds/     # ClassifiedsPage, ClassifiedDetailPage
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
│   ├── apps/                    # 14 Django apps
│   │   ├── accounts/            # User model, auth, profiles, statuses
│   │   ├── organization/        # Department, Position
│   │   ├── roles/               # RBAC - Role, Permission
│   │   ├── skills/              # SkillCategory, Skill, UserSkill
│   │   ├── achievements/        # Achievement, AchievementAward
│   │   ├── news/                # News, Comment, Reaction, NewsAttachment
│   │   ├── notifications/       # Notification, NotificationSettings
│   │   ├── audit/               # AuditLog
│   │   ├── kudos/               # Kudos (благодарности)
│   │   ├── surveys/             # Survey, Question, Response (опросы)
│   │   ├── ideas/               # Idea, IdeaVote, IdeaComment (банк идей)
│   │   ├── faq/                 # FAQCategory, FAQItem
│   │   └── classifieds/         # Classified, ClassifiedImage (объявления)
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
- Properties: full_name, current_status, role (returns primary admin role or first role)
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
- Fields: name (unique), description, permissions (M2M), is_system, is_admin
- Default roles: Employee, HR, Content Manager, Achievement Admin, Admin
- `is_admin` field marks roles with full administrative access

### skills.SkillCategory, Skill, UserSkill, SkillEndorsement
- Proficiency levels: beginner, intermediate, advanced, expert
- UserSkill has property: `endorsements_count`
- SkillEndorsement: colleagues can endorse each other's skills
  - Unique constraint: (user_skill, endorsed_by)
  - Validation: cannot endorse own skills
  - Triggers notification on endorsement

### achievements.Achievement, AchievementAward
- Categories: professional, corporate, social, special
- Icon field stores emoji
- **Automatic Achievements:**
  - Fields: `is_automatic` (bool), `trigger_type` (choice), `trigger_value` (int)
  - 9 trigger types: comments_count, reactions_given, reactions_received, news_created, logins_count, profile_views, endorsements_received, skills_count, achievements_count
  - Automatically awarded via Django signals when user reaches threshold
  - Service layer: `services.py` with get_user_stats(), check_automatic_achievements(), get_all_achievement_progress()
  - Signal handlers in `signals.py` for all trigger points
  - Creates notifications when automatically awarded

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

### surveys.Survey, Question, QuestionOption, Response, Answer
- Survey status: draft, active, closed
- Target types: all, department, role
- Question types: single_choice, multiple_choice, scale, text, nps
- Anonymous surveys supported (user set to null in Response)
- Questions and responses counted via annotations in ViewSet (not model properties)
- Actions: publish, close (changes status)
- Author cannot be changed after creation

### ideas.Idea, IdeaVote, IdeaComment
- Categories: process, product, culture, other
- Status: new, under_review, approved, in_progress, implemented, rejected
- Voting: upvote/downvote system, users cannot vote on own ideas
- Admin can change status with optional comment
- Vote API: POST /ideas/{id}/vote/, DELETE /ideas/{id}/unvote/

### classifieds.Classified, ClassifiedImage
- Categories defined in ClassifiedCategory model
- Status: active, closed, expired
- Multiple images support with ordering
- Contact info can be customized per classified
- Price is optional

### faq.FAQCategory, FAQItem
- Categories with icon and order
- Items with question/answer (answer supports rich text)
- Pagination disabled for categories (returns array, not paginated)

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
- GET `/organization/tree/` - Organization tree with nested departments
- GET `/organization/departments/{id}/skills-matrix/` - Skills matrix for department (with optional ?category=<id>)

### Skills
- GET `/skills/categories/`
- GET `/skills/`
- GET/POST `/skills/my/` - Current user's skills
- PATCH/DELETE `/skills/my/{skill_id}/` - Update/delete own skill
- GET `/users/{id}/skills/` - User's skills
- POST `/skills/endorse/` - Endorse a skill (body: user_id, skill_id)
- DELETE `/skills/endorse/` - Remove endorsement (body: user_id, skill_id)
- GET `/skills/users/{user_id}/skills/{skill_id}/endorsements/` - List endorsements

### Achievements
- GET `/achievements/` - List all achievements (active for non-admins)
- GET `/achievements/types/` - Get achievement types
- POST `/achievements/types/` - Create achievement type (admin)
- PATCH `/achievements/types/{id}/` - Update achievement type (admin)
- DELETE `/achievements/types/{id}/` - Delete achievement type (admin)
- POST `/achievements/award/` - Award achievement to user
- GET `/achievements/feed/` - Achievement awards feed
- GET `/achievements/my/` - Current user's achievements
- GET `/achievements/user/{user_id}/` - User's achievements
- GET `/achievements/stats/` - Achievement statistics
- GET `/achievements/leaderboard/` - Achievement leaderboard with filters
- GET `/achievements/trigger-types/` - Available trigger types for automatic achievements (admin)
- GET `/achievements/progress/` - Current user's progress towards automatic achievements
- GET `/achievements/progress/{user_id}/` - User's progress towards automatic achievements

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

### Surveys
- GET/POST `/surveys/` - List/create surveys
- GET/PATCH/DELETE `/surveys/{id}/` - Survey detail/update/delete
- GET `/surveys/my/` - Surveys user needs to respond to
- POST `/surveys/{id}/publish/` - Publish draft survey
- POST `/surveys/{id}/close/` - Close active survey
- POST `/surveys/{id}/respond/` - Submit survey response
- GET `/surveys/{id}/results/` - Get survey results (admin/author only)

### Ideas
- GET/POST `/ideas/` - List/create ideas
- GET/PATCH/DELETE `/ideas/{id}/` - Idea detail/update/delete
- GET `/ideas/my/` - Current user's ideas
- POST `/ideas/{id}/vote/` - Vote on idea (body: {is_upvote: boolean})
- DELETE `/ideas/{id}/unvote/` - Remove vote
- PATCH `/ideas/{id}/update_status/` - Update idea status (admin only)
- GET/POST `/ideas/{id}/comments/` - Get/add comments
- GET `/ideas/categories/` - List categories
- GET `/ideas/statuses/` - List statuses

### Classifieds
- GET/POST `/classifieds/` - List/create classifieds
- GET/PATCH/DELETE `/classifieds/{id}/` - Classified detail/update/delete
- GET `/classifieds/my/` - Current user's classifieds
- POST `/classifieds/{id}/close/` - Close classified
- GET `/classifieds/categories/` - List categories

### FAQ
- GET `/faq/categories/` - List categories (no pagination)
- GET `/faq/categories/with_items/` - Categories with nested items
- GET `/faq/items/` - List all items (no pagination)
- Admin can CRUD categories and items

### Kudos
- GET/POST `/kudos/` - List/send kudos
- GET `/kudos/my/` - Kudos sent/received by current user
- GET `/kudos/stats/` - Kudos statistics
- GET `/kudos/categories/` - List kudos categories

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

### AchievementProgress (`frontend/src/components/features/achievements/AchievementProgress.tsx`)
- Displays user's progress towards automatic achievements
- Accordion grouped by trigger type
- ProgressBar for incomplete achievements
- Shows current value / target value and percentage
- Checkmark indicator for achieved
- Props: `userId?: number, showTitle?: boolean`
- Integrated into AchievementsPage

### SkillsMatrix (`frontend/src/components/features/organization/SkillsMatrix.tsx`)
- Heat map table showing skills per department
- Rows: skills, Columns: employees
- Color-coded skill levels (beginner/intermediate/advanced/expert)
- Filter by skill category
- Export to CSV with BOM for Excel compatibility
- Legend with level indicators
- Summary statistics (total skills, total employees)
- Props: `departmentId: number`

### OrgChart (`frontend/src/components/features/organization/OrgChart.tsx`)
- Interactive organization diagram
- Hierarchical department cards with head info
- Expand/collapse nodes (individual + all)
- Zoom (buttons + Ctrl+wheel) and pan (drag)
- Click on head → navigate to profile
- Shows employees count per department
- Props: `className?: string`

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
- Recent commits focus on:
  - **Phase 5 Implementation:**
    - Surveys module (create, edit, publish, respond, results)
    - Ideas/Bank of Ideas (voting, status management, comments)
    - Classifieds/Marketplace (CRUD, images, categories)
    - FAQ module with categories
    - Kudos system
  - **Phase 4 Implementation:**
    - Automatic achievements system with 9 trigger types
    - Skills matrix (heat map) for departments with CSV export
    - Interactive org chart diagram with zoom/pan
  - Skills module with endorsements
  - Carbon Design System migration
  - News drafts, scheduling, and rich-text editor
  - Gallery with lightbox
  - @mentions in comments
  - Bug fixes and UI improvements

## Recommendations for Future Development

1. ~~**Unify UI Components**~~ - Radix UI removed, using Carbon exclusively ✅
2. ~~**Implement Carbon Grid**~~ - Main pages using Carbon Grid ✅
3. **Add Dark Theme** - Consider `g100` theme option
4. **Use Carbon DataTable** - For all admin panel tables (already partially done)
5. **Add Carbon Notifications** - ToastNotification, InlineNotification
6. **Setup CI/CD** - Add GitHub Actions for tests, linting, deployment
7. **Expand Tests** - Add more unit and integration tests
8. **API Documentation** - Enable drf-spectacular UI endpoint


## Important Implementation Notes

### Model Properties vs Annotations
- **Survey model**: `questions_count` and `responses_count` should NOT be defined as model properties - they are created via annotations in ViewSet's `get_queryset()` to avoid conflicts

### RBAC User.role Property
- User model has a `role` property that returns the primary role (first with `is_admin=True` or first role)
- This allows code like `user.role.is_admin` to work even though `roles` is M2M field

### Frontend API HTTP Methods
- Ideas voting: `POST /vote/` for vote, `DELETE /unvote/` for unvote
- Ideas status: `PATCH /update_status/` (not POST)
- Always check backend `@action` decorator for correct HTTP method

### Owner Restrictions
- Ideas: Users cannot vote on their own ideas (400 error from backend)
- Frontend should disable/hide voting UI for idea authors

---

*Document created: 2025-11-23*
*Last updated: 2025-11-25 - Added Phase 5 modules (Surveys, Ideas, Classifieds, FAQ, Kudos)*
