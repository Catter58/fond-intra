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
│   │   │   ├── okr/             # OKRPage, OKRDetailPage
│   │   │   ├── bookings/        # BookingsPage, ResourceDetailPage
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
│   ├── apps/                    # 17 Django apps
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
│   │   ├── classifieds/         # Classified, ClassifiedImage (объявления)
│   │   ├── okr/                 # OKRPeriod, Objective, KeyResult, CheckIn (OKR)
│   │   ├── bookings/            # ResourceType, Resource, Booking (бронирование)
│   │   └── interactions/        # Bookmark, ViewHistory, ProfileView
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

### accounts.TwoFactorSettings
- Two-Factor Authentication settings using TOTP via `pyotp`
- Fields: user (OneToOne), is_enabled, secret, backup_codes (JSONField, hashed), enabled_at
- Methods: generate_secret(), get_totp_uri(), verify_token(), generate_backup_codes(), verify_backup_code()
- Backup codes are hashed with SHA-256, one-time use

### accounts.UserSession
- User session tracking for security management
- Fields: user (FK), token_jti (unique), device_type, device_name, browser, os, ip_address, location, user_agent, created_at, last_activity, is_active
- Methods: create_from_request(), terminate()
- Parses User-Agent via `user-agents` library
- Session termination blacklists JWT token

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

### okr.OKRPeriod, Objective, KeyResult, CheckIn
- OKRPeriod: name, type (quarter/year), starts_at, ends_at, is_active
- Objective: title, description, level (company/department/personal), status (draft/active/completed/cancelled)
  - FK to: period, owner (User), department (nullable), parent (self, nullable for cascading)
  - progress computed from key_results
- KeyResult: title, type (quantitative/qualitative), target_value, current_value, start_value, unit
  - progress computed as percentage
- CheckIn: previous_value, new_value, comment, created_at
  - FK to: key_result, author (User)

### bookings.ResourceType, Resource, Booking
- ResourceType: name, slug, icon, description, is_active, order
- Resource: name, description, location, capacity, amenities (JSON), image
  - work_hours_start, work_hours_end (TimeField)
  - min_booking_duration, max_booking_duration (minutes)
  - FK to: type (ResourceType)
- Booking: title, description, starts_at, ends_at, status (confirmed/cancelled)
  - is_recurring, recurrence_rule (JSON), parent_booking (FK to self)
  - Properties: duration_minutes, is_past, is_active
  - FK to: resource, user
  - Validation: no time conflicts, within work hours, min/max duration

### interactions.Bookmark, ViewHistory, ProfileView
- Bookmark: Generic content-type based bookmarks
  - ContentType choices: 'user', 'news'
  - Fields: user (FK), content_type, object_id, created_at
  - Unique constraint: (user, content_type, object_id)
- ViewHistory: Recent profile views tracking
  - Fields: user (FK), viewed_user (FK), viewed_at
  - Unique constraint: (user, viewed_user), auto-updates viewed_at
  - Limited to 20 most recent views
- ProfileView: Aggregated profile view stats
  - Fields: user (OneToOne), view_count, last_viewed_at
  - Incremented when user views another profile

## API Endpoints (v1)

Base URL: `/api/v1/`

### Authentication
- POST `/auth/login/` - JWT login (returns `requires_2fa: true` if 2FA enabled)
- POST `/auth/logout/` - Blacklist token
- POST `/auth/token/refresh/` - Refresh access token
- POST `/auth/password/change/` - Change password
- POST `/auth/password/reset/` - Request reset
- POST `/auth/password/reset/confirm/` - Confirm reset

### Two-Factor Authentication
- GET `/auth/2fa/status/` - Get 2FA status for current user
- POST `/auth/2fa/setup/` - Initiate 2FA setup (returns secret, QR code base64, provisioning URI)
- POST `/auth/2fa/verify/` - Verify TOTP token and enable 2FA (returns backup codes)
- POST `/auth/2fa/disable/` - Disable 2FA (requires password)
- POST `/auth/2fa/backup-codes/` - Generate new backup codes
- POST `/auth/2fa/authenticate/` - Authenticate with 2FA token (body: user_id, token, is_backup_code)

### User Sessions
- GET `/auth/sessions/` - List user's active sessions
- POST `/auth/sessions/{id}/terminate/` - Terminate specific session
- POST `/auth/sessions/terminate-all/` - Terminate all sessions except current

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

### OKR
- GET/POST `/okr/periods/` - OKR periods (Q1 2025, Year 2025, etc.)
- GET/POST `/okr/objectives/` - List/create objectives
- GET/PATCH/DELETE `/okr/objectives/{id}/` - Objective detail/update/delete
- GET `/okr/objectives/my/` - Current user's objectives
- GET `/okr/objectives/team/` - Team objectives (subordinates)
- GET `/okr/objectives/company/` - Company-level objectives
- GET `/okr/objectives/tree/` - Objective hierarchy tree
- POST `/okr/objectives/{id}/add_key_result/` - Add key result
- POST `/okr/key-results/{id}/check-in/` - Record check-in progress
- GET/PATCH/DELETE `/okr/key-results/{id}/` - Key result CRUD
- GET `/okr/stats/` - OKR statistics and progress analytics

### Bookings
- GET/POST `/resource-types/` - Resource types (meeting room, equipment, etc.)
- GET/POST `/resources/` - Resources with filters (type, capacity, search)
- GET/PATCH/DELETE `/resources/{id}/` - Resource detail
- GET `/resources/{id}/availability/` - Available time slots for a date
- GET/POST `/bookings/` - All bookings with filters
- GET/PATCH/DELETE `/bookings/{id}/` - Booking detail
- GET `/bookings/my/` - Current user's bookings
- GET `/bookings/calendar/` - Bookings for calendar view (start, end dates)
- POST `/bookings/{id}/cancel/` - Cancel booking
- POST `/bookings/{id}/extend/` - Extend booking duration
- GET `/bookings/stats/` - Booking statistics

### Interactions (Bookmarks, View History, Profile Stats)
- GET/POST `/bookmarks/` - List bookmarks / toggle bookmark (create or delete)
- DELETE `/bookmarks/{id}/` - Delete bookmark by ID
- GET `/bookmarks/users/` - Get bookmarked users
- GET `/bookmarks/news/` - Get bookmarked news
- GET `/bookmarks/check/?type=user&ids=1,2,3` - Check if items are bookmarked
- GET `/view-history/` - Recent profile views (last 20)
- POST `/view-history/record/` - Record profile view (body: user_id)
- DELETE `/view-history/clear/` - Clear view history
- GET `/profile-stats/` - Current user's profile stats
- GET `/profile-stats/{user_id}/` - User's profile stats (views, achievements, kudos, skills, etc.)

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

### ResourceModal (`frontend/src/components/features/bookings/ResourceModal.tsx`)
- Modal for creating/editing booking resources (admin only)
- Fields: name, description, location, capacity, type, work hours, duration limits, amenities
- Toggle for active status
- Dynamic amenities list with add/remove
- Integrated with React Query for mutations
- Props: `isOpen: boolean, onClose: () => void, resource?: Resource | null`

### OKRDashboard (`frontend/src/components/features/okr/OKRDashboard.tsx`)
- Visual analytics dashboard for OKR progress
- Overview cards: personal/team/company average progress
- Key results summary: completed/in-progress/not-started
- Distribution charts: by status, by level, by progress range
- Top objectives by progress with clickable navigation
- Recent check-ins timeline with progress delta indicators
- Props: `stats: OKRStats, loading?: boolean`

### PageBreadcrumb (`frontend/src/components/ui/PageBreadcrumb.tsx`)
- Automatic breadcrumb navigation based on route configuration
- Pattern matching for dynamic routes (e.g., `/employees/:id`)
- Russian labels for all routes
- Uses Carbon Breadcrumb components
- Props: `className?: string, customLabel?: string`

### Skeletons (`frontend/src/components/ui/Skeletons.tsx`)
- Collection of skeleton loading components:
  - EmployeeCardSkeleton, NewsCardSkeleton, AchievementCardSkeleton
  - ProfileSkeleton, TableSkeleton, TableRowSkeleton
  - StatTileSkeleton, ListItemSkeleton, PageHeaderSkeleton
  - KudosCardSkeleton, SurveyCardSkeleton, BookingCardSkeleton, OKRCardSkeleton
- Uses Carbon SkeletonText and SkeletonPlaceholder

### KeyboardHelpModal (`frontend/src/components/ui/KeyboardHelpModal.tsx`)
- Modal showing available keyboard shortcuts
- Grouped by category (Navigation, Actions)
- Keyboard key styling with `<kbd>` elements
- Toggle via Shift+? or custom event

### OnboardingTour (`frontend/src/components/ui/OnboardingTour.tsx`)
- Interactive tour for new users using react-joyride
- 11 steps covering main portal features
- Auto-starts for users with `has_completed_onboarding: false`
- Can be restarted from Security page
- Stores completion status on server
- Props: `forceRun?: boolean, onComplete?: () => void`

### DashboardWidget (`frontend/src/components/features/dashboard/DashboardWidget.tsx`)
- Draggable dashboard widget wrapper
- Uses @dnd-kit for drag & drop
- Edit mode with visibility toggle
- Props: `id, title, icon, children, isEditMode, isVisible, onToggleVisibility`

### AdminDataTable (`frontend/src/components/admin/AdminDataTable.tsx`)
- Reusable Carbon DataTable wrapper for admin pages
- Features: search, pagination, row actions, bulk selection, CSV export
- Generic typing: `<T extends { id: string | number }>`
- Props:
  - `rows, headers, renderCell` - data and rendering
  - `isLoading, emptyMessage, emptyIcon` - state display
  - `searchPlaceholder, searchValue, onSearchChange` - search
  - `totalItems, page, pageSize, onPageChange` - pagination
  - `rowActions` - OverflowMenu actions per row
  - `enableSelection, bulkActions` - batch operations
  - `exportConfig` - CSV export button
- Also exports `exportToCSV()` utility function

## Stores

### dashboardStore (`frontend/src/store/dashboardStore.ts`)
- Zustand store for dashboard customization
- Persists to localStorage and syncs to server
- Manages widget order and visibility
- Edit mode toggle
- Methods: `setEditMode, toggleWidgetVisibility, reorderWidgets, resetToDefault, loadFromServer, saveToServer`

## Hooks

### useKeyboardShortcuts (`frontend/src/hooks/useKeyboardShortcuts.ts`)
- Global keyboard shortcut handler
- Gmail-style multi-key sequences (e.g., `g h` for home)
- Navigation shortcuts: g+h (home), g+e (employees), g+n (news), etc.
- Action shortcuts: / (focus search), Esc (blur), Shift+? (help)
- Ignores shortcuts when typing in inputs/textareas

### useThemeStore (`frontend/src/store/themeStore.ts`)
- Zustand store for theme preferences
- ThemePreference: 'light' | 'dark' | 'system'
- ResolvedTheme: 'g10' (light) | 'g100' (dark)
- System theme detection via matchMedia
- Persisted to localStorage

## Known Issues & Technical Debt

1. ~~**Mixed UI Libraries**~~ - Radix UI removed, using Carbon only ✅
2. ~~**Inline Styles**~~ - MainLayout.tsx refactored to use CSS/SCSS classes ✅
3. ~~**Custom Dropdowns**~~ - User menu, notifications, theme menu using CSS classes ✅
4. ~~**Grid System**~~ - Main pages using Carbon Grid ✅
5. ~~**DataTable**~~ - Admin tables using AdminDataTable component ✅
6. ~~**Notifications**~~ - Using Carbon ToastNotification with CSS classes ✅
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
export DATABASE_URL="postgres://fond_intra:devpassword@localhost:5432/fond_intra"
python manage.py migrate
python manage.py init_roles    # Initialize default roles
python manage.py runserver
```

### Test Data
```bash
cd backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.development
export DATABASE_URL="postgres://fond_intra:devpassword@localhost:5432/fond_intra"
python scripts/create_test_data.py
```

Creates:
- 7 test users (password: `test123`)
- 4 departments (IT, HR, Marketing, Administration)
- 5 positions
- 3 achievements with awards
- 2 news articles
- 1 OKR period with objectives
- 3 resource types + 3 resources for booking

Test user emails: `ivan.petrov@test.com`, `maria.sidorova@test.com`, etc.

### Docker - Local Development
```bash
# Start PostgreSQL and Redis containers
docker run -d --name fond_db -e POSTGRES_DB=fond_intra -e POSTGRES_USER=fond_intra -e POSTGRES_PASSWORD=devpassword -p 5432:5432 postgres:16-alpine
docker run -d --name fond_redis -p 6379:6379 redis:7-alpine

# Stop containers
docker stop fond_db fond_redis
docker rm fond_db fond_redis
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
  - **Phase 8 Implementation (Polish & UX):**
    - Dark theme support with light/dark/system options (Zustand + localStorage)
    - Breadcrumb navigation with route pattern matching
    - Skeleton loading states for all major pages
    - Keyboard shortcuts (Gmail-style g+key navigation, Shift+? help)
    - KeyboardHelpModal component for shortcut documentation
  - **Phase 7 Implementation (Security):**
    - Two-Factor Authentication (TOTP) via pyotp
    - QR code generation for authenticator apps
    - Backup codes (one-time use, SHA-256 hashed)
    - User session management
    - Session termination (individual/all)
    - Updated login flow for 2FA
  - **Phase 6 Completion (OKR & Bookings):**
    - OKR Dashboard with progress charts and analytics
    - OKR stats API endpoint for progress tracking
    - OKR Dashboard widget on main dashboard
    - Bookings Dashboard widget
    - Recurring bookings UI (daily/weekly, day selection, end date)
    - Celery tasks for bookings (reminders, daily summary, cleanup)
    - Celery tasks for classifieds (expire, notify expiring)
    - FAQ admin CRUD
    - Booking cancel button on "My Bookings" tab
    - Fixed various bugs (resource creation, booking cancellation validation)
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
    - OrgChart: expandable employee list within department cards with profile navigation
    - OrgChart: curved/rounded connector lines between departments
  - Skills module with endorsements
  - Carbon Design System migration
  - News drafts, scheduling, and rich-text editor
  - Gallery with lightbox
  - @mentions in comments
  - Bug fixes and UI improvements

## Recommendations for Future Development

1. ~~**Unify UI Components**~~ - Radix UI removed, using Carbon exclusively ✅
2. ~~**Implement Carbon Grid**~~ - Main pages using Carbon Grid ✅
3. ~~**Add Dark Theme**~~ - Implemented with light/dark/system options ✅
4. ~~**Use Carbon DataTable**~~ - Admin panel tables refactored with AdminDataTable component ✅
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
*Last updated: 2025-11-26 - OrgChart improvements: expandable employee list, curved connector lines, fixed expand/collapse buttons*
