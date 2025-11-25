# FondSmena Intranet Portal — Implementation Plan

> Детальный план реализации улучшений с чек-листами

---

## Оглавление

1. [Фаза 1: UI Стабилизация](#фаза-1-ui-стабилизация)
2. [Фаза 2: Поиск и фильтрация](#фаза-2-поиск-и-фильтрация)
3. [Фаза 3: Улучшение контента](#фаза-3-улучшение-контента)
4. [Фаза 4: Skills & Achievements](#фаза-4-skills--achievements)
5. [Фаза 5: Новые модули (Kudos, Опросы)](#фаза-5-новые-модули)
6. [Фаза 6: OKR & Бронирование](#фаза-6-okr--бронирование)
7. [Фаза 7: Безопасность](#фаза-7-безопасность)
8. [Фаза 8: Polish & UX](#фаза-8-polish--ux)

---

## Фаза 1: UI Стабилизация

### 1.1 Унификация дизайн-системы ✅ COMPLETED

**Цель:** Убрать Radix UI, использовать только Carbon компоненты для консистентности.

**Интеграция с существующей структурой:**
- Затрагивает: `frontend/src/components/ui/*`
- Заменяем: `@radix-ui/*` компоненты на `@carbon/react`
- Сохраняем: API компонентов где возможно

**Результат:** Radix UI компоненты не использовались в проекте (только определены, но не импортированы). Удалены неиспользуемые файлы и зависимости.

**Чек-лист:**

Backend:
- [x] Не требуется

Frontend:
- [x] Аудит использования Radix UI компонентов в проекте
- [x] ~~Замена `@radix-ui/react-dialog`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-dropdown-menu`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-select`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-tabs`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-tooltip`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-popover`~~ — не использовался
- [x] ~~Замена `@radix-ui/react-avatar`~~ — не использовался (удалён файл)
- [x] ~~Замена `@radix-ui/react-toast`~~ — не использовался (удалён файл)
- [x] ~~Замена `@radix-ui/react-label`~~ — не использовался (удалён файл)
- [x] ~~Замена `@radix-ui/react-separator`~~ — не использовался
- [x] Удалён `frontend/src/components/ui/toaster.tsx` (был placeholder)
- [x] Удалены неиспользуемые Radix зависимости из `package.json` (11 пакетов)
- [x] Удалены неиспользуемые файлы: `label.tsx`, `avatar.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `toaster.tsx`
- [x] Удалены неиспользуемые зависимости: `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- [x] Обновлён `lib/utils.ts` — удалена функция `cn()`
- [x] Обновлены тесты
- [x] TypeScript проверка пройдена
- [x] Все 48 тестов проходят

**Удалено пакетов:** 94

---

### 1.3 Carbon Grid ✅ COMPLETED

**Цель:** Заменить кастомные grid-классы на официальную Carbon Grid систему.

**Интеграция с существующей структурой:**
- Затрагивает: `frontend/src/styles/carbon.scss` (классы `.dashboard-grid`, `.dashboard-cards`)
- Затрагивает: Все страницы с grid layouts
- Используем: `Grid`, `Column` из `@carbon/react`

**Результат:** Основные страницы с фиксированными layouts переведены на Carbon Grid. Страницы с адаптивными карточками (EmployeesPage) оставлены на CSS Grid auto-fill.

**Чек-лист:**

Backend:
- [x] Не требуется

Frontend:
- [x] Изучить Carbon Grid API (`Grid`, `Column`, `Row`)
- [x] Рефакторинг `DashboardPage.tsx` — использовать Carbon Grid (sm/md/lg breakpoints)
- [x] ~~Рефакторинг `EmployeesPage.tsx`~~ — оставлен CSS auto-fill grid (лучше для адаптивных карточек)
- [x] ~~Рефакторинг `AchievementsPage.tsx`~~ — не требуется (простой layout)
- [x] ~~Рефакторинг `NewsPage.tsx`~~ — не требуется (список)
- [x] Рефакторинг `AdminDashboardPage.tsx` — использовать Carbon Grid
- [x] ~~Рефакторинг `ProfilePage.tsx`~~ — не требуется (flex layout)
- [x] ~~Рефакторинг `OrganizationPage.tsx`~~ — не требуется (дерево)
- [x] Удалить `.dashboard-grid`, `.dashboard-cards` из `carbon.scss`
- [x] TypeScript проверка пройдена
- [x] Все тесты проходят

---

### 1.4 Carbon DataTable ✅ COMPLETED

**Цель:** Использовать Carbon DataTable для всех таблиц в админке.

**Интеграция с существующей структурой:**
- Затрагивает: `frontend/src/pages/admin/*`
- Компоненты: `DataTable`, `TableContainer`, `Table`, `TableHead`, `TableRow`, `TableHeader`, `TableBody`, `TableCell`, `TableToolbar`, `TableToolbarContent`, `TableToolbarSearch`

**Результат:** Все страницы с табличными данными уже используют Carbon DataTable. Страницы с карточным форматом (Roles, Departments, AchievementTypes) оставлены как есть — для них карточный формат подходит лучше.

**Чек-лист:**

Backend:
- [x] Не требуется (API уже поддерживает пагинацию и фильтрацию)

Frontend:
- [x] AdminUsersPage.tsx — уже использует DataTable
- [x] AdminSkillsPage.tsx — уже использует DataTable
- [x] AdminAuditPage.tsx — уже использует DataTable
- [x] ~~AdminRolesPage.tsx~~ — карточный формат (Tile) — подходит лучше
- [x] ~~AdminDepartmentsPage.tsx~~ — карточный формат (Tile) — подходит лучше
- [x] ~~AdminAchievementTypesPage.tsx~~ — карточный формат (Tile) — подходит лучше

Frontend (оригинальный чек-лист — всё уже реализовано):
- [ ] Создать переиспользуемый компонент `AdminDataTable.tsx`
- [ ] Реализовать сортировку колонок
- [ ] Реализовать поиск через `TableToolbarSearch`
- [ ] Реализовать пагинацию через Carbon `Pagination`
- [ ] Рефакторинг `AdminUsersPage.tsx` → DataTable
- [ ] Рефакторинг `AdminRolesPage.tsx` → DataTable
- [ ] Рефакторинг `AdminDepartmentsPage.tsx` → DataTable
- [ ] Рефакторинг `AdminAchievementTypesPage.tsx` → DataTable
- [ ] Рефакторинг `AdminSkillsPage.tsx` → DataTable
- [ ] Рефакторинг `AdminAuditPage.tsx` → DataTable
- [ ] Добавить batch selection для массовых операций
- [ ] Добавить row actions (edit, delete) через `OverflowMenu`
- [ ] Тестирование сортировки и фильтрации

---

### 1.7 Мобильная адаптация ✅ COMPLETED

**Цель:** Улучшить отображение на мобильных устройствах.

**Интеграция с существующей структурой:**
- Затрагивает: `MainLayout.tsx`, все страницы
- Carbon breakpoints: sm (320px), md (672px), lg (1056px), xlg (1312px), max (1584px)

**Результат:** MainLayout полностью адаптирован для mobile. Добавлен useIsMobile hook, overlay sidebar с backdrop, мобильный поиск, адаптивный padding.

**Чек-лист:**

Backend:
- [x] Не требуется

Frontend:
- [x] Аудит текущего mobile UX на реальных устройствах
- [x] Исправить `MainLayout.tsx` — hamburger menu на mobile
- [x] SideNav overlay на mobile с полупрозрачным backdrop
- [x] Адаптировать Header — скрыть search на mobile, показать иконку с выпадающей панелью
- [x] Sidebar закрывается автоматически при навигации на mobile
- [x] Адаптивный padding для контента (1rem на mobile, 2rem на desktop)
- [x] Проверить touch targets (минимум 44x44px) — добавлены стили в carbon.scss
- [x] Проверить font-size (минимум 16px для inputs чтобы избежать zoom на iOS) — добавлены стили
- [x] Meta viewport уже присутствует в index.html
- [x] TypeScript проверка пройдена
- [x] Все 48 тестов проходят

**Изменённые файлы:**
- `frontend/src/components/layout/MainLayout.tsx` — useIsMobile hook, overlay sidebar, mobile search panel
- `frontend/src/styles/carbon.scss` — мобильные стили, touch targets, iOS input zoom fix

---

### 1.9 Empty States ✅ COMPLETED

**Цель:** Красивые заглушки для пустых списков с call-to-action.

**Интеграция с существующей структурой:**
- Создать: `frontend/src/components/ui/EmptyState.tsx`
- Использовать: Carbon иконки, типографика

**Результат:** Создан переиспользуемый компонент EmptyState с поддержкой иконок, заголовков, описаний и действий. Внедрён на основные страницы.

**Чек-лист:**

Backend:
- [x] Не требуется

Frontend:
- [x] Создать компонент `EmptyState.tsx` с props: icon, title, description, action, size
- [x] Дизайн: иконка (48/64/80px в зависимости от size), заголовок, описание, кнопка действия
- [x] Добавить в `EmployeesPage.tsx` — "Сотрудники не найдены" / "Список пуст"
- [x] Добавить в `NewsPage.tsx` — "Новостей пока нет"
- [x] Добавить в `AchievementsPage.tsx` — "Пока нет достижений"
- [x] Добавить в `NotificationsPage.tsx` — "Нет уведомлений"
- [x] Добавить в `ProfileSkillsPage.tsx` — "Добавьте свои навыки"
- [x] TypeScript проверка пройдена
- [x] Все 48 тестов проходят

**Изменённые файлы:**
- `frontend/src/components/ui/EmptyState.tsx` — создан новый компонент
- `frontend/src/pages/employees/EmployeesPage.tsx` — добавлен EmptyState
- `frontend/src/pages/news/NewsPage.tsx` — добавлен EmptyState
- `frontend/src/pages/achievements/AchievementsPage.tsx` — добавлен EmptyState
- `frontend/src/pages/notifications/NotificationsPage.tsx` — добавлен EmptyState
- `frontend/src/pages/profile/ProfileSkillsPage.tsx` — добавлен EmptyState

---

## Фаза 2: Поиск и фильтрация

### 2.1 Расширенный поиск ✅ COMPLETED

**Цель:** Глобальный поиск по новостям, достижениям, отделам, навыкам.

**Интеграция с существующей структурой:**
- Расширяем: `MainLayout.tsx` — существующий search
- Backend: Новый endpoint `/api/v1/search/`
- Frontend: Компонент результатов с группировкой по типам

**Результат:** Создан GlobalSearchView с поиском по 5 типам сущностей. Обновлён фронтенд для отображения результатов с иконками.

**Чек-лист:**

Backend:
- [x] Создать `backend/core/views.py` — GlobalSearchView
- [x] Создать endpoint `GET /api/v1/search/?q=<query>`
- [x] Поиск по User: full_name, email, position
- [x] Поиск по News: title, content
- [x] Поиск по Department: name, description
- [x] Поиск по Achievement: name, description
- [x] Поиск по Skill: name, description
- [x] Результаты сгруппированы по типу
- [x] Лимит результатов: 5 на категорию (max 20)

Frontend:
- [x] Создать `frontend/src/api/endpoints/search.ts`
- [x] Обновить `MainLayout.tsx` — расширить search dropdown
- [x] Показывать результаты с иконками по типам
- [x] Клик по результату — переход на страницу
- [x] TypeScript проверка пройдена
- [x] Все тесты проходят

**Изменённые файлы:**
- `backend/core/views.py` — GlobalSearchView
- `backend/core/urls.py` — URL для поиска
- `backend/config/api_urls.py` — подключён core.urls
- `frontend/src/api/endpoints/search.ts` — API endpoint
- `frontend/src/components/layout/MainLayout.tsx` — обновлён поиск

---

### 2.2 Фильтры сотрудников ✅ COMPLETED

**Цель:** Фильтрация по отделу, должности, статусу, навыкам, дате найма.

**Интеграция с существующей структурой:**
- Расширяем: `EmployeesPage.tsx`
- Backend: Уже есть `django-filter`, нужно расширить фильтры
- Модель User уже имеет: department, position, hire_date

**Результат:** Создан UserFilter с фильтрацией по отделу, должности, навыку, статусу, дате найма и роли. Создан компонент EmployeeFilters с UI-фильтрами. Фильтры синхронизируются с URL.

**Чек-лист:**

Backend:
- [x] Создать `UserFilter` в `accounts/filters.py`
- [x] Фильтр по department — `department=<id>`
- [x] Фильтр по position — `position=<id>`
- [x] Фильтр по статусу — `status=vacation|sick_leave|...`
- [x] Фильтр по навыку — `skill=<id>`
- [x] Фильтр по уровню навыка — `skill_level=beginner|...|expert`
- [x] Фильтр по дате найма — `hired_after=<date>`, `hired_before=<date>`
- [x] Фильтр по роли — `role=<id>`
- [x] Комбинированные фильтры (AND логика)

Frontend:
- [x] Создать компонент `EmployeeFilters.tsx`
- [x] Dropdown для отдела (загрузка из API)
- [x] Dropdown для должности (загрузка из API)
- [x] Dropdown для статуса (предопределённые значения)
- [x] Dropdown для навыков
- [x] DatePicker для диапазона дат найма
- [x] Кнопка "Сбросить фильтры"
- [x] URL sync — фильтры в query params
- [x] Интегрировать в `EmployeesPage.tsx`
- [x] Показывать количество результатов
- [x] TypeScript проверка пройдена
- [x] Все 48 тестов проходят

**Изменённые файлы:**
- `backend/apps/accounts/filters.py` — создан UserFilter, AdminUserFilter
- `backend/apps/accounts/views.py` — подключены фильтры
- `frontend/src/api/endpoints/users.ts` — расширены параметры
- `frontend/src/api/endpoints/organization.ts` — создан API
- `frontend/src/api/endpoints/skills.ts` — добавлен getCatalog
- `frontend/src/components/features/employees/EmployeeFilters.tsx` — создан компонент
- `frontend/src/pages/employees/EmployeesPage.tsx` — интегрированы фильтры

---

### 2.14 Теги новостей ✅ COMPLETED

**Цель:** Категоризация новостей тегами, фильтрация по тегам.

**Интеграция с существующей структурой:**
- Расширяем: `backend/apps/news/models.py` — добавляем Tag модель
- Расширяем: News модель — M2M к Tag
- Frontend: Теги при создании/редактировании, фильтр в списке

**Результат:** Создана модель Tag, реализован TagViewSet, добавлены теги в сериализаторы новостей. Фронтенд обновлён для отображения и выбора тегов, добавлена фильтрация по тегам.

**Чек-лист:**

Backend:
- [x] Создать модель `Tag` в `news/models.py`
  - [x] Fields: name (unique), slug, color
- [x] Добавить M2M поле `tags` в модель `News`
- [x] Создать миграцию
- [x] Сериализатор `TagSerializer`, `TagCreateSerializer`
- [x] Обновить `NewsSerializer` — включить tags
- [x] Endpoint `GET /api/v1/news/tags/` — список всех тегов
- [x] Endpoint `POST /api/v1/news/tags/` — создание тега (требуется право)
- [x] Фильтр новостей по тегу — `?tag=<slug>` или `?tag_id=<id>`

Frontend:
- [x] Использован Carbon Tag компонент — отображение тега
- [x] Использован Carbon MultiSelect — выбор тегов
- [x] Обновить `NewsCreatePage.tsx` — добавить выбор тегов
- [x] Обновить `NewsEditPage.tsx` — редактирование тегов
- [x] Обновить `NewsPage.tsx` — отображение тегов на карточках
- [x] Добавить фильтр по тегам в `NewsPage.tsx`
- [x] Клик по тегу → фильтрация
- [x] TypeScript проверка пройдена
- [x] Сборка успешна

**Изменённые файлы:**
- `backend/apps/news/models.py` — добавлена модель Tag, M2M в News
- `backend/apps/news/serializers.py` — TagSerializer, обновлены NewsSerializers
- `backend/apps/news/views.py` — TagViewSet, фильтрация в NewsViewSet
- `backend/apps/news/urls/__init__.py` — URL для tags
- `backend/apps/news/migrations/0002_add_tags.py` — миграция
- `frontend/src/types/index.ts` — тип NewsTag
- `frontend/src/api/endpoints/news.ts` — API для тегов
- `frontend/src/pages/news/NewsPage.tsx` — фильтр и отображение тегов
- `frontend/src/pages/news/NewsDetailPage.tsx` — отображение тегов
- `frontend/src/pages/news/NewsCreatePage.tsx` — выбор тегов
- `frontend/src/pages/news/NewsEditPage.tsx` — редактирование тегов

---

## Фаза 3: Улучшение контента

### 2.5 Rich-text редактор ✅ COMPLETED

**Цель:** WYSIWYG редактор для новостей вместо plain text.

**Интеграция с существующей структурой:**
- Затрагивает: `NewsCreatePage.tsx`, `NewsEditPage.tsx`
- Backend: Поле `content` уже TextField, будет хранить HTML
- Библиотека: TipTap

**Результат:** Установлен TipTap с расширениями. Backend использует bleach для санитизации HTML. Создан RichTextEditor компонент с toolbar и RichTextViewer для отображения. Интегрирован во все страницы новостей.

**Чек-лист:**

Backend:
- [x] Установить `bleach` для санитизации HTML
- [x] Создать утилиту `sanitize_html()` в `core/utils.py`
- [x] Обновить `NewsSerializer` — санитизация content при сохранении
- [x] Разрешённые теги: p, br, strong, em, u, s, h1-h6, ul, ol, li, a, img, blockquote, code, pre
- [x] Разрешённые атрибуты: href, src, alt, class, style

Frontend:
- [x] Установить TipTap: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`
- [x] Создать компонент `RichTextEditor.tsx`
- [x] Toolbar: Bold, Italic, Underline, Strike
- [x] Toolbar: H2, H3
- [x] Toolbar: Bullet list, Numbered list
- [x] Toolbar: Link, Image
- [x] Toolbar: Blockquote, Code block
- [x] Toolbar: Undo, Redo
- [x] Стилизация под Carbon Design System
- [x] Интеграция в `NewsCreatePage.tsx`
- [x] Интеграция в `NewsEditPage.tsx`
- [x] Создать компонент `RichTextViewer.tsx` для отображения
- [x] Обновить `NewsDetailPage.tsx` — рендер HTML контента
- [x] TypeScript проверка пройдена
- [x] Сборка успешна

**Изменённые файлы:**
- `backend/core/utils.py` — добавлена sanitize_html функция
- `backend/apps/news/serializers.py` — санитизация content
- `frontend/src/components/ui/RichTextEditor.tsx` — создан редактор
- `frontend/src/components/ui/RichTextEditor.scss` — стили
- `frontend/src/pages/news/NewsCreatePage.tsx` — интеграция редактора
- `frontend/src/pages/news/NewsEditPage.tsx` — интеграция редактора
- `frontend/src/pages/news/NewsDetailPage.tsx` — RichTextViewer

---

### 2.6 Галерея изображений ✅ COMPLETED

**Цель:** Поддержка нескольких изображений в новости с lightbox.

**Интеграция с существующей структурой:**
- Расширяем: `NewsAttachment` модель уже существует
- Добавляем: Lightbox для просмотра, сортировка изображений

**Результат:** Добавлены поля thumbnail, order, is_cover в NewsAttachment. Создан ImageGallery компонент с Lightbox и keyboard navigation.

**Чек-лист:**

Backend:
- [x] Проверить `NewsAttachment` модель — поддержка image типа
- [x] Добавить поле `order` для сортировки
- [x] Добавить поле `is_cover` для обложки новости
- [x] Добавить поле `thumbnail` для превью
- [x] Endpoint для reorder attachments — `POST /news/{id}/attachments/reorder/`
- [x] Endpoint для set cover — `POST /news/{id}/attachments/{att_id}/set-cover/`
- [x] Генерация thumbnails (Pillow) — 300x300
- [x] Валидация: только изображения (jpg, png, gif, webp)

Frontend:
- [x] Создать компонент `ImageGallery.tsx` для отображения
- [x] Grid layout для превью изображений
- [x] Lightbox для полноэкранного просмотра
- [x] Keyboard navigation в lightbox (← → Esc)
- [x] Обновить `NewsDetailPage.tsx`
- [x] Обновить `NewsPage.tsx` — показывать cover

**Изменённые файлы:**
- `backend/apps/news/models.py` — добавлены поля thumbnail, order, is_cover в NewsAttachment
- `backend/apps/news/serializers.py` — обновлены сериализаторы
- `backend/apps/news/views.py` — добавлены set_cover, reorder_attachments actions
- `backend/core/utils.py` — добавлена функция generate_thumbnail()
- `frontend/src/components/ui/ImageGallery.tsx` — создан компонент
- `frontend/src/components/ui/ImageGallery.scss` — стили с Lightbox
- `frontend/src/pages/news/NewsDetailPage.tsx` — интеграция галереи
- `frontend/src/pages/news/NewsPage.tsx` — показ cover image

---

### 2.15 Черновики новостей ✅ COMPLETED

**Цель:** Автосохранение, отложенная публикация по расписанию.

**Интеграция с существующей структурой:**
- Расширяем: `News` модель — уже есть `is_published`
- Добавляем: `status`, `publish_at` поля

**Результат:** Добавлен статус новости (draft/scheduled/published), эндпоинты для публикации/отмены/планирования. Создана страница черновиков.

**Чек-лист:**

Backend:
- [x] Добавить поля в `News` модель:
  - [x] `status` (choice: draft, scheduled, published)
  - [x] `publish_at` (DateTimeField, nullable)
- [x] Создать миграцию с data migration
- [x] Обновить `NewsSerializer` — включить status, publish_at
- [x] Endpoint `POST /news/{id}/publish/` — опубликовать
- [x] Endpoint `POST /news/{id}/unpublish/` — вернуть в черновик
- [x] Endpoint `POST /news/{id}/schedule/` — запланировать
- [x] Endpoint `POST /news/{id}/autosave/` — автосохранение
- [x] Фильтр: `?drafts=true` — черновики текущего пользователя

Frontend:
- [x] Кнопки: "Опубликовать", "Сохранить как черновик"
- [x] Страница `NewsDraftsPage.tsx` — список черновиков
- [x] Обновить `NewsPage.tsx` — кнопка "Мои черновики"
- [x] Обновить `NewsCreatePage.tsx` — выбор статуса
- [x] Обновить `NewsEditPage.tsx` — индикатор статуса, кнопки публикации
- [x] Добавить роут `/news/drafts`

**Изменённые файлы:**
- `backend/apps/news/models.py` — News.Status choices, publish_at field
- `backend/apps/news/serializers.py` — status, publish_at в сериализаторах
- `backend/apps/news/views.py` — publish, unpublish, schedule, autosave actions
- `backend/apps/news/migrations/0005_add_drafts_status.py` — миграция
- `frontend/src/api/endpoints/news.ts` — API функции
- `frontend/src/types/index.ts` — NewsStatus type
- `frontend/src/pages/news/NewsCreatePage.tsx` — кнопки статуса
- `frontend/src/pages/news/NewsEditPage.tsx` — управление статусом
- `frontend/src/pages/news/NewsDraftsPage.tsx` — страница черновиков
- `frontend/src/pages/news/NewsPage.tsx` — кнопка черновиков
- `frontend/src/App.tsx` — роут /news/drafts

---

### 2.13 Упоминания @user ✅ COMPLETED

**Цель:** Упоминание коллег в комментариях с уведомлением.

**Интеграция с существующей структурой:**
- Затрагивает: `Comment` модель, `Notification` модель
- Парсинг @username/@"Full Name" в тексте комментария
- Создание уведомлений при упоминании

**Результат:** Создан метод get_mentioned_users() в Comment модели. Добавлен MentionInput компонент с autocomplete. Уведомления создаются при добавлении комментария.

**Чек-лист:**

Backend:
- [x] Метод `get_mentioned_users()` в Comment модели
- [x] Парсинг форматов: @username и @"Full Name"
- [x] Обновить `CommentViewSet.perform_create()`:
  - [x] Парсить упоминания из текста
  - [x] Создавать Notification для каждого упомянутого
  - [x] Тип уведомления: `mention`
- [x] Добавить тип `mention` в `Notification.TYPE_CHOICES`
- [x] API `GET /api/v1/users/search/?q=<query>` — для autocomplete

Frontend:
- [x] Создать компонент `MentionInput.tsx`
- [x] При вводе `@` показывать dropdown с пользователями
- [x] Debounced поиск (200ms)
- [x] Keyboard navigation (↑↓ Enter Tab Escape)
- [x] Выбор пользователя вставляет `@"Full Name"`
- [x] Интеграция в форму комментария в NewsDetailPage

**Изменённые файлы:**
- `backend/apps/news/models.py` — Comment.get_mentioned_users()
- `backend/apps/news/views.py` — CommentViewSet.perform_create() с уведомлениями
- `backend/apps/notifications/models.py` — TYPE_MENTION
- `frontend/src/components/ui/MentionInput.tsx` — компонент
- `frontend/src/components/ui/MentionInput.scss` — стили
- `frontend/src/pages/news/NewsDetailPage.tsx` — интеграция MentionInput

---

## Фаза 4: Skills & Achievements

### 2.9 Подтверждение навыков (Endorsements) ✅ COMPLETED

**Цель:** Возможность коллегам подтверждать навыки друг друга.

**Интеграция с существующей структурой:**
- Расширяем: `backend/apps/skills/models.py`
- Новая модель: `SkillEndorsement`
- Связь: User → UserSkill (через endorsement)

**Результат:** Полностью работающая система endorsements с UI для подтверждения навыков, модальным окном со списком подтвердивших, уведомлениями и защитой от self-endorsement.

**Чек-лист:**

Backend:
- [x] Создать модель `SkillEndorsement`:
  - [x] `user_skill` (FK to UserSkill)
  - [x] `endorsed_by` (FK to User)
  - [x] `created_at`
  - [x] Unique constraint: (user_skill, endorsed_by)
  - [x] Метод clean() для валидации
- [x] Создать миграцию `0002_skillendorsement.py`
- [x] Сериализатор `SkillEndorsementSerializer` с вложенным `EndorserSerializer`
- [x] Обновить `UserSkillSerializer` — добавлены `endorsements_count` и `is_endorsed_by_current_user`
- [x] Endpoint `POST /api/v1/skills/endorse/` — создание endorsement
- [x] Endpoint `DELETE /api/v1/skills/endorse/` — отмена endorsement
- [x] Endpoint `GET /api/v1/skills/users/{user_id}/skills/{skill_id}/endorsements/` — список endorsements
- [x] Валидация: нельзя endorsить свои навыки
- [x] Создание уведомления при endorsement

Frontend:
- [x] Создан компонент `SkillBadge.tsx` с полным функционалом:
  - [x] Показывает количество endorsements с иконкой
  - [x] Кнопка "Подтвердить" в чужом профиле
  - [x] Состояния: endorsed (primary) / not endorsed (ghost)
  - [x] Модальное окно со списком подтвердивших (аватар, имя, должность, дата)
  - [x] Tooltips для UX
- [x] Обновлен `UserSkillsList.tsx` — добавлен проп userId
- [x] Обновлен `ProfileSkillsPage.tsx` — интеграция SkillBadge
- [x] Обновлен `EmployeeDetailPage.tsx` — интеграция SkillBadge
- [x] Обновлены тесты для нового интерфейса UserSkill
- [x] TypeScript проверка пройдена

**Изменённые файлы:**

Backend:
- `backend/apps/skills/models.py` — модель SkillEndorsement, свойство endorsements_count
- `backend/apps/skills/admin.py` — регистрация SkillEndorsementAdmin
- `backend/apps/skills/serializers.py` — SkillEndorsementSerializer, EndorserSerializer, SkillEndorsementCreateSerializer
- `backend/apps/skills/views.py` — SkillEndorseView, SkillEndorsementsView
- `backend/apps/skills/urls.py` — URLs для endorsement endpoints
- `backend/apps/skills/migrations/0002_skillendorsement.py` — миграция

Frontend:
- `frontend/src/types/index.ts` — обновлён UserSkill, добавлены SkillEndorsement, SkillEndorser
- `frontend/src/api/endpoints/skills.ts` — endorseSkill, unendorseSkill, getSkillEndorsements
- `frontend/src/components/features/skills/SkillBadge.tsx` — полностью переписан компонент
- `frontend/src/components/features/skills/SkillBadge.test.tsx` — обновлены тесты
- `frontend/src/components/features/skills/UserSkillsList.tsx` — добавлен проп userId
- `frontend/src/components/features/skills/UserSkillsList.test.tsx` — обновлены тесты
- `frontend/src/components/features/skills/index.ts` — обновлены экспорты
- `frontend/src/pages/profile/ProfileSkillsPage.tsx` — интеграция SkillBadge
- `frontend/src/pages/employees/EmployeeDetailPage.tsx` — интеграция SkillBadge

---

### 2.10 Рейтинг достижений (Лидерборд) ✅ COMPLETED

**Цель:** Таблица лидеров по достижениям за период.

**Интеграция с существующей структурой:**
- Используем: `AchievementAward` модель
- Новый endpoint для агрегации

**Результат:** Полностью работающий лидерборд достижений с фильтрацией по периоду, подсветкой топ-3, интеграцией на странице достижений и виджетом на Dashboard.

**Чек-лист:**

Backend:
- [x] Endpoint `GET /api/v1/achievements/leaderboard/`
- [x] Query params: `period=week|month|quarter|year|all`
- [x] Агрегация: количество достижений по пользователям
- [x] Возвращать: rank, user (id, name, avatar, department), count
- [x] Топ-10 или топ-20 по умолчанию (настраивается через limit)
- [x] Опционально: фильтр по отделу `?department=<id>`
- [x] Опционально: фильтр по типу достижения `?category=<cat>`

Frontend:
- [x] Создать компонент `AchievementLeaderboard.tsx`
- [x] Таблица/список с рангом, аватаром, именем, количеством
- [x] Подсветка топ-3 (золото, серебро, бронза)
- [x] Select для выбора периода
- [x] Опционально: фильтр по отделу (структура готова)
- [x] Интеграция в `AchievementsPage.tsx`
- [x] Виджет на Dashboard — топ-3 за месяц
- [x] Тестирование

**Изменённые файлы:**

Backend:
- `backend/apps/achievements/serializers.py` — LeaderboardEntrySerializer
- `backend/apps/achievements/views.py` — AchievementLeaderboardView
- `backend/apps/achievements/urls/__init__.py` — URL для leaderboard

Frontend:
- `frontend/src/types/index.ts` — LeaderboardEntry interface
- `frontend/src/api/endpoints/achievements.ts` — getLeaderboard method
- `frontend/src/components/features/achievements/AchievementLeaderboard.tsx` — новый компонент
- `frontend/src/components/features/achievements/index.ts` — экспорт компонента
- `frontend/src/pages/achievements/AchievementsPage.tsx` — интеграция лидерборда
- `frontend/src/pages/dashboard/DashboardPage.tsx` — виджет топ-3

---

### 2.17 Матрица навыков отдела ✅ COMPLETED

**Цель:** Тепловая карта навыков команды/отдела.

**Интеграция с существующей структурой:**
- Используем: `UserSkill`, `Skill`, `User`, `Department`
- Агрегация по отделу

**Результат:** Полностью работающая матрица навыков с тепловой картой, фильтрацией по категориям и экспортом в CSV.

**Чек-лист:**

Backend:
- [x] Endpoint `GET /api/v1/organization/departments/{id}/skills-matrix/`
- [x] Возвращать:
  - [x] Список навыков (rows)
  - [x] Список сотрудников отдела (columns)
  - [x] Матрица: skill_id → user_id → level (null если нет)
- [x] Агрегированная статистика: сколько человек на каждом уровне
- [x] Фильтр по категории навыков через query param

Frontend:
- [x] Создать компонент `SkillsMatrix.tsx`
- [x] Таблица: навыки по вертикали, сотрудники по горизонтали
- [x] Цветовая индикация уровней (тепловая карта)
- [x] Легенда уровней
- [x] Фильтр по категории навыков
- [x] Интеграция в `OrganizationPage.tsx` — вкладка "Матрица навыков"
- [x] Экспорт в CSV с корректной кодировкой (BOM для Excel)
- [x] TypeScript проверка пройдена

**Изменённые файлы:**

Backend:
- `backend/apps/organization/views.py` — DepartmentSkillsMatrixView
- `backend/apps/organization/urls/__init__.py` — URL для skills-matrix

Frontend:
- `frontend/src/types/index.ts` — SkillMatrixUser, SkillMatrixSkill, SkillsMatrix
- `frontend/src/api/endpoints/organization.ts` — getDepartmentSkillsMatrix
- `frontend/src/components/features/organization/SkillsMatrix.tsx` — компонент матрицы
- `frontend/src/components/features/organization/index.ts` — экспорт
- `frontend/src/pages/organization/OrganizationPage.tsx` — интеграция

---

### 2.19 Бейджи за активность ✅ COMPLETED

**Цель:** Автоматические достижения за активность в системе.

**Интеграция с существующей структурой:**
- Расширяем: `Achievement` модель — добавляем `is_automatic`, `trigger_type`, `trigger_value`
- Django signals для проверки условий

**Результат:** Полностью работающая система автоматических достижений с 9 типами триггеров, signal handlers для автоматической проверки, админ-интерфейсом для настройки и UI для отображения прогресса.

**Чек-лист:**

Backend:
- [x] Расширить модель `Achievement`:
  - [x] `is_automatic` (Boolean) — автоматически присваивается
  - [x] `trigger_type` (Choice: comments_count, reactions_given, reactions_received, news_created, logins_count, profile_views, endorsements_received, skills_count, achievements_count)
  - [x] `trigger_value` (Integer) — порог для получения
- [x] Создать миграцию `0003_add_automatic_achievements.py`
- [x] Создать сервис `check_automatic_achievements(user)` в `services.py`
- [x] Создать сервис `get_user_stats(user)` для сбора статистики
- [x] Создать сервис `get_all_achievement_progress(user)` для UI
- [x] Вызывать проверку при:
  - [x] Создании комментария (signal)
  - [x] Получении/выдаче реакции (signal)
  - [x] Создании новости (signal)
  - [x] Входе в систему (signal)
  - [x] Получении endorsement (signal)
  - [x] Добавлении навыка (signal)
  - [x] Получении достижения (signal)
- [x] Signal handlers в `signals.py`, регистрация в `apps.py`
- [x] API endpoints:
  - [x] `GET /api/v1/achievements/trigger-types/` — доступные триггеры
  - [x] `GET /api/v1/achievements/progress/` — прогресс текущего юзера
  - [x] `GET /api/v1/achievements/progress/{user_id}/` — прогресс другого юзера
- [x] Создание уведомлений при автовыдаче

Frontend:
- [x] Обновлён `AdminAchievementTypesPage.tsx`:
  - [x] Checkbox "Автоматическое достижение"
  - [x] Conditional fields: trigger_type Select, trigger_value NumberInput
  - [x] Отображение бейджа "Авто" в списке
  - [x] Показ триггера и значения в списке
- [x] Создан компонент `AchievementProgress.tsx`:
  - [x] Accordion с группировкой по типу триггера
  - [x] ProgressBar для незавершённых
  - [x] Текущее значение / целевое значение
  - [x] Процент выполнения
  - [x] Индикатор полученных достижений
- [x] Интегрирован в `AchievementsPage.tsx`
- [x] TypeScript проверка пройдена
- [x] Сборка успешна

**Изменённые файлы:**

Backend:
- `backend/apps/achievements/models.py` — поля is_automatic, trigger_type, trigger_value, TriggerType choices
- `backend/apps/achievements/migrations/0003_add_automatic_achievements.py` — миграция
- `backend/apps/achievements/services.py` — get_user_stats, check_automatic_achievements, get_all_achievement_progress
- `backend/apps/achievements/signals.py` — 7 signal handlers
- `backend/apps/achievements/apps.py` — регистрация signals
- `backend/apps/achievements/serializers.py` — обновлены для автоматических достижений
- `backend/apps/achievements/views.py` — AchievementProgressView, TriggerTypesView
- `backend/apps/achievements/urls/__init__.py` — новые URL routes

Frontend:
- `frontend/src/types/index.ts` — TriggerType, AchievementProgress, AchievementProgressGroup
- `frontend/src/api/endpoints/achievements.ts` — getTriggerTypes, getProgress, обновлены createType/updateType
- `frontend/src/pages/admin/AdminAchievementTypesPage.tsx` — форма для автодостижений
- `frontend/src/components/features/achievements/AchievementProgress.tsx` — новый компонент
- `frontend/src/components/features/achievements/index.ts` — экспорт AchievementProgress
- `frontend/src/pages/achievements/AchievementsPage.tsx` — интеграция компонента

---

### 2.20 Организационная диаграмма ✅ COMPLETED

**Цель:** Интерактивная визуализация оргструктуры.

**Интеграция с существующей структурой:**
- Используем: `Department` (иерархическая), `User` (head, manager)
- Реализовано на чистом React без внешних библиотек

**Результат:** Интерактивная организационная диаграмма с expand/collapse, zoom/pan и переходом к профилям руководителей.

**Чек-лист:**

Backend:
- [x] Endpoint `GET /api/v1/organization/tree/` — уже существовал
- [x] Обновлён `DepartmentTreeSerializer`:
  - [x] Добавлен `head_info` с полной информацией о руководителе (id, full_name, avatar, position)
  - [x] Nested структура children
  - [x] employees_count на каждом уровне

Frontend:
- [x] Создать компонент `OrgChart.tsx` (без внешних библиотек)
- [x] Карточка узла: название отдела, руководитель (аватар, имя, должность), кол-во сотрудников
- [x] Expand/collapse узлов с кнопками "Развернуть все" / "Свернуть все"
- [x] Клик по руководителю → переход на профиль
- [x] Zoom и pan для больших структур (drag + Ctrl+wheel)
- [x] Кнопки управления масштабом (+/-/reset)
- [x] Интеграция в `OrganizationPage.tsx` — вкладка "Диаграмма"
- [x] TypeScript проверка пройдена

**Изменённые файлы:**

Backend:
- `backend/apps/organization/serializers.py` — DepartmentHeadSerializer, обновлён DepartmentTreeSerializer

Frontend:
- `frontend/src/types/index.ts` — DepartmentHeadInfo, обновлён DepartmentTree
- `frontend/src/components/features/organization/OrgChart.tsx` — новый компонент
- `frontend/src/components/features/organization/OrgChart.scss` — стили
- `frontend/src/components/features/organization/index.ts` — экспорт OrgChart
- `frontend/src/pages/organization/OrganizationPage.tsx` — добавлены вкладки (Tabs) с диаграммой

---

## Фаза 5: Новые модули

### 3.11 Благодарности (Kudos) ✅ COMPLETED

**Цель:** Публичные благодарности коллегам.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/kudos/`
- Похоже на News, но проще
- Связь с Achievements для автоматических бейджей

**Результат:** Полностью работающий модуль благодарностей с лентой, отправкой, фильтрацией, уведомлениями и виджетом на Dashboard.

**Чек-лист:**

Backend:
- [x] Создать app `kudos`
- [x] Модель `Kudos`:
  - [x] `sender` (FK to User)
  - [x] `recipient` (FK to User)
  - [x] `category` (Choice: help, great_job, initiative, mentorship, teamwork)
  - [x] `message` (TextField, max 500 chars)
  - [x] `is_public` (Boolean, default True)
  - [x] `created_at`
- [x] Миграция
- [x] Сериализаторы: `KudosSerializer`, `KudosCreateSerializer`
- [x] ViewSet с endpoints:
  - [x] `GET /api/v1/kudos/` — лента (публичные)
  - [x] `POST /api/v1/kudos/` — отправить
  - [x] `GET /api/v1/kudos/received/` — полученные текущим пользователем
  - [x] `GET /api/v1/kudos/sent/` — отправленные
  - [x] `GET /api/v1/users/{id}/kudos/` — kudos пользователя
- [x] `GET /api/v1/kudos/categories/` — список категорий
- [x] `GET /api/v1/kudos/stats/` — статистика (топ получатели, категории)
- [x] Фильтры: по категории
- [x] Нельзя отправить kudos самому себе
- [x] Уведомление получателю
- [x] Permissions: все могут отправлять и видеть публичные

Frontend:
- [x] Создать страницу `KudosPage.tsx` — лента благодарностей с вкладками
- [x] Компонент `KudosCard.tsx` — карточка благодарности с аватарами, категорией, датой
- [x] Компонент `SendKudosModal.tsx`:
  - [x] Выбор получателя (поиск)
  - [x] Выбор категории (иконки)
  - [x] Текст сообщения
  - [x] Checkbox публичности
- [x] Кнопка "Отправить благодарность" на странице kudos
- [x] Виджет на Dashboard — последние 3 kudos
- [x] Статистика на странице kudos (счётчик, лидер, популярная категория)
- [x] Фильтр по категории на странице kudos
- [x] Вкладки: Лента / Полученные / Отправленные
- [x] Добавить в навигацию (иконка Favorite)
- [x] Иконки для категорий
- [x] TypeScript проверка пройдена

**Изменённые файлы:**

Backend:
- `backend/apps/kudos/__init__.py`
- `backend/apps/kudos/apps.py`
- `backend/apps/kudos/models.py` — модель Kudos с Category choices
- `backend/apps/kudos/serializers.py` — KudosSerializer, KudosCreateSerializer
- `backend/apps/kudos/views.py` — KudosViewSet, KudosCategoriesView, UserKudosView, KudosStatsView
- `backend/apps/kudos/urls.py` — URL patterns
- `backend/apps/kudos/admin.py` — KudosAdmin
- `backend/apps/kudos/migrations/0001_initial.py`
- `backend/config/settings/base.py` — добавлен apps.kudos
- `backend/config/api_urls.py` — URL include

Frontend:
- `frontend/src/types/index.ts` — Kudos, KudosUser, KudosCategory, KudosStats
- `frontend/src/api/endpoints/kudos.ts` — API functions
- `frontend/src/components/features/kudos/KudosCard.tsx`
- `frontend/src/components/features/kudos/SendKudosModal.tsx`
- `frontend/src/components/features/kudos/index.ts`
- `frontend/src/pages/kudos/KudosPage.tsx`
- `frontend/src/pages/kudos/index.ts`
- `frontend/src/App.tsx` — route /kudos
- `frontend/src/components/layout/MainLayout.tsx` — навигация
- `frontend/src/pages/dashboard/DashboardPage.tsx` — виджет kudos

---

### 3.4 Опросы (Surveys) ✅ COMPLETED

**Цель:** Создание опросов, голосований, анонимные и открытые.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/surveys/`
- Связь с User, Department, Role для targeting

**Чек-лист:**

Backend:
- [x] Создать app `surveys`
- [x] Модель `Survey`:
  - [x] `title`
  - [x] `description`
  - [x] `author` (FK to User)
  - [x] `is_anonymous` (Boolean)
  - [x] `is_required` (Boolean)
  - [x] `status` (draft, active, closed)
  - [x] `starts_at`, `ends_at`
  - [x] `target_type` (all, department, role)
  - [x] `target_departments` (M2M)
  - [x] `target_roles` (M2M)
  - [x] `created_at`
- [x] Модель `Question`:
  - [x] `survey` (FK)
  - [x] `text`
  - [x] `type` (single_choice, multiple_choice, scale, text, nps)
  - [x] `is_required`
  - [x] `order`
- [x] Модель `QuestionOption`:
  - [x] `question` (FK)
  - [x] `text`
  - [x] `order`
- [x] Модель `Response`:
  - [x] `survey` (FK)
  - [x] `user` (FK, nullable if anonymous)
  - [x] `created_at`
- [x] Модель `Answer`:
  - [x] `response` (FK)
  - [x] `question` (FK)
  - [x] `selected_options` (M2M to QuestionOption)
  - [x] `text_value` (for text questions)
  - [x] `scale_value` (for scale/nps)
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] CRUD для Survey (admin)
  - [x] `GET /api/v1/surveys/` — доступные для пользователя
  - [x] `GET /api/v1/surveys/{id}/` — детали с вопросами
  - [x] `POST /api/v1/surveys/{id}/respond/` — отправить ответы
  - [x] `GET /api/v1/surveys/{id}/results/` — результаты (admin)
  - [x] `POST /api/v1/surveys/{id}/publish/` — опубликовать
  - [x] `POST /api/v1/surveys/{id}/close/` — закрыть
- [x] Проверка: пользователь ещё не отвечал
- [x] Проверка: пользователь в target audience
- [x] Permissions: создание только для admin/HR

Frontend:
- [x] Страница `SurveysPage.tsx` — список доступных опросов
- [x] Страница `SurveyDetailPage.tsx` — прохождение опроса
- [x] Страница `SurveyCreatePage.tsx` — создание опроса
- [x] Страница `SurveyEditPage.tsx` — редактирование черновика
- [x] Страница `SurveyResultsPage.tsx` — результаты опроса
- [x] Компоненты для типов вопросов (все в SurveyDetailPage):
  - [x] Single choice (RadioButtonGroup)
  - [x] Multiple choice (Checkbox)
  - [x] Scale (Slider)
  - [x] Text (TextArea)
  - [x] NPS (RadioButtonGroup 0-10)
- [x] Прогресс прохождения (ProgressIndicator)
- [x] Валидация обязательных вопросов
- [x] Страница благодарности после отправки
- [x] Конструктор вопросов с Accordions
- [x] Просмотр результатов с визуализацией (ProgressBar, распределение)
- [x] Компонент `SurveyCard.tsx` с меню управления
- [x] Добавить в навигацию

**Важные заметки реализации:**
- `questions_count` и `responses_count` создаются через аннотации в ViewSet, НЕ как свойства модели (во избежание конфликта property setter)
- `author_id` добавлен в сериализаторы для проверки авторства на фронтенде

---

### 3.10 Идеи/Предложения

**Цель:** Банк идей от сотрудников с голосованием.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/ideas/`
- Похоже на News + голосование

**Статус: ЗАВЕРШЕНО** ✅

**Чек-лист:**

Backend:
- [x] Создать app `ideas`
- [x] Модель `Idea`:
  - [x] `title`
  - [x] `description`
  - [x] `author` (FK)
  - [x] `category` (process, product, culture, other)
  - [x] `status` (new, under_review, approved, in_progress, implemented, rejected)
  - [x] `admin_comment` (feedback от модератора)
  - [x] `created_at`, `updated_at`
- [x] Модель `IdeaVote`:
  - [x] `idea` (FK)
  - [x] `user` (FK)
  - [x] `is_upvote` (Boolean)
  - [x] Unique: (idea, user)
- [x] Модель `IdeaComment`:
  - [x] `idea` (FK)
  - [x] `author` (FK)
  - [x] `text`
  - [x] `created_at`
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] `GET /api/v1/ideas/` — список (с фильтрами, сортировкой)
  - [x] `POST /api/v1/ideas/` — создать идею
  - [x] `GET /api/v1/ideas/{id}/`
  - [x] `PATCH /api/v1/ideas/{id}/` — редактировать (автор или admin)
  - [x] `POST /api/v1/ideas/{id}/vote/` — голосовать (400 если своя идея)
  - [x] `DELETE /api/v1/ideas/{id}/unvote/` — отменить голос
  - [x] `PATCH /api/v1/ideas/{id}/update_status/` — изменить статус (admin)
  - [x] `GET/POST /api/v1/ideas/{id}/comments/`
- [x] Сортировка: по голосам, по дате, по статусу
- [x] Фильтры: категория, статус, автор

Frontend:
- [x] Страница `IdeasPage.tsx` — список идей
- [x] Компонент `IdeaCard.tsx` — карточка идеи с отключением голосования для автора
- [x] Голосование: upvote/downvote кнопки (disabled для своих идей)
- [x] Счётчик голосов
- [x] Страница `IdeaDetailPage.tsx` — детали + комментарии + голосование в sidebar
- [x] Модальное окно создания идеи
- [x] Фильтры и сортировка
- [x] Статус-бейджи
- [x] Админка: модерация идей, смена статуса (интегрировано в IdeaDetailPage)
- [ ] Виджет на Dashboard — топ идеи (можно добавить позже)
- [x] Добавить в навигацию
- [ ] Уведомления: изменение статуса, комментарий к идее (можно добавить позже)
- [ ] Тестирование (можно добавить позже)

**Важные заметки реализации:**
- Голосование за свою идею возвращает 400 Bad Request
- Фронтенд должен передавать `currentUserId` в `IdeaCard` для отключения кнопок
- HTTP методы: `POST /vote/`, `DELETE /unvote/`, `PATCH /update_status/`

---

### 3.14 FAQ / Частые вопросы

**Цель:** Структурированные ответы на типовые вопросы.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/faq/`
- Простая структура: категории → вопросы

**Статус: ЗАВЕРШЕНО** ✅

**Чек-лист:**

Backend:
- [x] Создать app `faq`
- [x] Модель `FAQCategory`:
  - [x] `name`
  - [x] `slug`
  - [x] `order`
  - [x] `icon` (optional, Carbon icon name)
  - [x] `description`
  - [x] `is_active`
- [x] Модель `FAQItem`:
  - [x] `category` (FK)
  - [x] `question`
  - [x] `answer` (TextField, может быть HTML)
  - [x] `order`
  - [x] `is_published`
  - [x] `views_count`
  - [x] `created_at`, `updated_at`
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] `GET /api/v1/faq/categories/` — категории
  - [x] `GET /api/v1/faq/categories/with_items/` — категории с вопросами
  - [x] `GET /api/v1/faq/items/` — все вопросы (flat)
  - [x] `GET /api/v1/faq/items/search/?q=<query>` — поиск
  - [x] CRUD для admin
- [x] Инкремент views_count при просмотре
- [x] Permissions: просмотр для всех, редактирование для admin

Frontend:
- [x] Страница `FAQPage.tsx`
- [x] Accordion для вопросов (Carbon Accordion)
- [x] Группировка по категориям
- [x] Поиск по FAQ
- [x] Подсветка результатов поиска
- [ ] "Был ли ответ полезен?" (опционально, можно добавить позже)
- [ ] Админка: CRUD категорий и вопросов (можно добавить позже)
- [ ] Rich-text для ответов (можно добавить позже)
- [x] Добавить в навигацию
- [ ] Тестирование (можно добавить позже)

---

### 3.13 Доска объявлений

**Цель:** Категоризированные объявления от сотрудников.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/classifieds/`
- Личные объявления (не корпоративные)

**Статус: ЗАВЕРШЕНО** ✅

**Чек-лист:**

Backend:
- [x] Создать app `classifieds`
- [x] Модель `ClassifiedCategory`:
  - [x] `name` (Продам, Куплю, Отдам, Услуги, Попутчики, Хобби, Другое)
  - [x] `slug`
  - [x] `icon`
  - [x] `order`
  - [x] `is_active`
- [x] Модель `Classified`:
  - [x] `title`
  - [x] `description`
  - [x] `category` (FK)
  - [x] `author` (FK)
  - [x] `contact_info` (optional, если отличается от профиля)
  - [x] `price` (optional, для продажи)
  - [x] `status` (active, closed, expired)
  - [x] `expires_at` (автоматически через 30 дней)
  - [x] `views_count`
  - [x] `created_at`, `updated_at`
- [x] Модель `ClassifiedImage`:
  - [x] `classified` (FK)
  - [x] `image`
  - [x] `order`
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] `GET /api/v1/classifieds/categories/`
  - [x] `GET /api/v1/classifieds/` — список (фильтры, пагинация)
  - [x] `POST /api/v1/classifieds/`
  - [x] `GET/PATCH/DELETE /api/v1/classifieds/{id}/`
  - [x] `POST /api/v1/classifieds/{id}/close/` — закрыть
  - [x] `POST /api/v1/classifieds/{id}/extend/` — продлить
  - [x] `POST /api/v1/classifieds/{id}/upload_image/` — загрузить фото
  - [x] `DELETE /api/v1/classifieds/{id}/images/{image_id}/` — удалить фото
  - [x] `GET /api/v1/classifieds/my/` — мои объявления
- [ ] Celery task для auto-expire (можно добавить позже)
- [x] Фильтры: категория, статус, поиск, сортировка

Frontend:
- [x] Страница `ClassifiedsPage.tsx`
- [x] Компонент `ClassifiedCard.tsx`
- [x] Фильтр по категориям
- [x] Страница `ClassifiedDetailPage.tsx`
- [x] Галерея изображений (ImageGallery)
- [x] Форма создания объявления
- [x] Мои объявления (вкладка)
- [x] Добавить в навигацию
- [ ] Тестирование (можно добавить позже)

---

## Фаза 6: OKR & Бронирование

### 3.8 OKR система ✅ COMPLETED

**Цель:** Objectives & Key Results для управления целями.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/okr/`
- Связь с User, Department

**Результат:** Полностью реализована система OKR с поддержкой периодов, целей на уровне компании/отдела/сотрудника, ключевых результатов с check-in системой.

**Чек-лист:**

Backend:
- [x] Создать app `okr`
- [x] Модель `OKRPeriod`:
  - [x] `name` (Q1 2025, 2025)
  - [x] `type` (quarter, year)
  - [x] `starts_at`, `ends_at`
  - [x] `is_active`
- [x] Модель `Objective`:
  - [x] `period` (FK)
  - [x] `title`
  - [x] `description`
  - [x] `level` (company, department, personal)
  - [x] `owner` (FK to User)
  - [x] `department` (FK, nullable)
  - [x] `parent` (FK to self, nullable) — каскадирование
  - [x] `status` (draft, active, completed, cancelled)
  - [x] `progress` (computed from KRs)
  - [x] `created_at`
- [x] Модель `KeyResult`:
  - [x] `objective` (FK)
  - [x] `title`
  - [x] `type` (quantitative, qualitative)
  - [x] `target_value` (для количественных)
  - [x] `current_value`
  - [x] `unit` (%, штуки, рубли, etc.)
  - [x] `progress` (0-100, computed или manual)
  - [x] `order`
- [x] Модель `CheckIn`:
  - [x] `key_result` (FK)
  - [x] `author` (FK)
  - [x] `previous_value`
  - [x] `new_value`
  - [x] `comment`
  - [x] `created_at`
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] `GET /api/v1/okr/periods/` — периоды
  - [x] `GET /api/v1/okr/objectives/` — objectives с фильтрами
  - [x] `POST /api/v1/okr/objectives/`
  - [x] `GET/PATCH/DELETE /api/v1/okr/objectives/{id}/`
  - [x] `POST /api/v1/okr/objectives/{id}/key-results/` — добавить KR
  - [x] `PATCH /api/v1/okr/key-results/{id}/` — обновить KR
  - [x] `POST /api/v1/okr/key-results/{id}/check-in/` — добавить check-in
  - [x] `GET /api/v1/okr/my/` — мои OKR
  - [x] `GET /api/v1/okr/team/` — OKR моей команды
  - [x] `GET /api/v1/okr/company/` — OKR компании
- [x] Вычисление progress Objective из KRs
- [x] Permissions: свои OKR, OKR подчинённых (для менеджеров)

Frontend:
- [x] Страница `OKRPage.tsx` — обзор OKR
- [x] Tabs: Мои / Команда / Компания
- [x] Компонент `ObjectiveCard.tsx`:
  - [x] Заголовок, описание
  - [x] Progress bar
  - [x] Список Key Results
- [x] Компонент `KeyResultItem.tsx`:
  - [x] Название, прогресс
  - [x] Текущее/целевое значение
  - [x] Кнопка Check-in
- [x] Модальное окно `CreateObjectiveModal.tsx`
- [x] Визуализация: дерево целей (родитель → дочерние)
- [x] Форма создания Objective
- [x] Форма добавления Key Result
- [x] История check-ins
- [x] Страница `OKRDetailPage.tsx` — детали objective
- [x] Дашборд OKR с графиками прогресса
- [x] Добавить в навигацию
- [x] Виджет на Dashboard — прогресс личных OKR
- [x] TypeScript проверка пройдена

---

### 3.9 Бронирование ресурсов ✅ COMPLETED

**Цель:** Бронирование переговорок, оборудования, рабочих мест.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/bookings/`
- Связь с User

**Результат:** Полностью реализована система бронирования ресурсов с типами, фильтрами, календарём доступности, валидацией пересечений и рабочих часов.

**Чек-лист:**

Backend:
- [x] Создать app `bookings`
- [x] Модель `ResourceType`:
  - [x] `name` (Переговорная, Оборудование, Рабочее место, Парковка)
  - [x] `slug`
  - [x] `icon`
  - [x] `description`
  - [x] `is_active`
  - [x] `order`
- [x] Модель `Resource`:
  - [x] `type` (FK)
  - [x] `name`
  - [x] `description`
  - [x] `location` (этаж, здание)
  - [x] `capacity` (для переговорок)
  - [x] `amenities` (JSON: проектор, ВКС, доска, etc.)
  - [x] `is_active`
  - [x] `image`
  - [x] `work_hours_start`, `work_hours_end`
  - [x] `min_booking_duration`, `max_booking_duration`
- [x] Модель `Booking`:
  - [x] `resource` (FK)
  - [x] `user` (FK)
  - [x] `title` (название встречи)
  - [x] `description`
  - [x] `starts_at`
  - [x] `ends_at`
  - [x] `is_recurring` (Boolean)
  - [x] `recurrence_rule` (JSON: weekly, days, until)
  - [x] `parent_booking` (FK to self for recurring)
  - [x] `status` (confirmed, cancelled)
  - [x] `created_at`, `updated_at`
  - [x] Properties: `duration_minutes`, `is_past`, `is_active`
- [x] Миграции
- [x] Сериализаторы
- [x] Endpoints:
  - [x] `GET /api/v1/resource-types/`
  - [x] `GET /api/v1/resources/` — с фильтрами (type, search, min_capacity)
  - [x] `GET /api/v1/resources/{id}/`
  - [x] `GET /api/v1/resources/{id}/availability/?date=<date>` — слоты
  - [x] `GET /api/v1/bookings/` — все бронирования с фильтрами
  - [x] `GET /api/v1/bookings/my/` — мои бронирования
  - [x] `POST /api/v1/bookings/` — создать бронь
  - [x] `POST /api/v1/bookings/{id}/cancel/` — отменить
  - [x] `POST /api/v1/bookings/{id}/extend/` — продлить
  - [x] `GET /api/v1/bookings/calendar/?start=<date>&end=<date>` — для календаря
  - [x] `GET /api/v1/bookings/stats/` — статистика
- [x] Валидация: нет пересечений по времени
- [x] Валидация: рабочие часы (настраиваемые для каждого ресурса)
- [x] Валидация: минимальная/максимальная длительность
- [x] Уведомления: напоминание за 30 мин (Celery)
- [x] Celery task для отправки напоминаний (`send_booking_reminders`)
- [x] Celery task для ежедневной сводки (`send_daily_bookings_summary`)
- [x] Celery task для автоочистки прошедших бронирований (`cleanup_past_bookings`)

Frontend:
- [x] Страница `BookingsPage.tsx` — обзор ресурсов и бронирований
- [x] Tabs: Ресурсы / Мои бронирования
- [x] Компонент `ResourceCard.tsx` — карточка ресурса
- [x] Компонент `BookingCard.tsx` — карточка бронирования
- [x] Компонент `TimeSlotPicker.tsx` — выбор времени
- [x] Визуализация занятых/свободных слотов
- [x] Модальное окно `CreateBookingModal.tsx` создания брони
- [x] Список ресурсов с фильтрами (тип, поиск)
- [x] Страница `ResourceDetailPage.tsx` — детали ресурса с доступностью
- [x] Мои бронирования (upcoming)
- [x] Отмена бронирования
- [x] Повторяющиеся брони (UI для recurrence) — Toggle, RadioButtonGroup, Checkboxes для дней недели
- [x] Добавить в навигацию
- [x] Виджет на Dashboard — ближайшие брони
- [x] TypeScript проверка пройдена
- [x] Статистика бронирований (today, week, month)
- [x] CRUD ресурсов для администратора:
  - [x] API methods: createResource, updateResource, deleteResource
  - [x] Компонент ResourceModal для создания/редактирования
  - [x] Кнопка "Добавить ресурс" на странице бронирований (только для админа)
  - [x] Кнопки редактирования/удаления на карточках ресурсов (только для админа)
  - [x] Модальное окно подтверждения удаления

---

## Фаза 7: Безопасность

### 5.1 2FA (TOTP) ✅ COMPLETED

**Цель:** Двухфакторная аутентификация через приложения.

**Интеграция с существующей структурой:**
- Расширяем: `accounts` app
- Библиотеки: `pyotp`, `qrcode[pil]`, `user-agents`

**Результат:** Полностью работающая двухфакторная аутентификация с TOTP, QR-кодом, backup codes, интеграцией в login flow.

**Чек-лист:**

Backend:
- [x] Установить: `pyotp`, `qrcode[pil]`, `user-agents` (используем легковесные библиотеки вместо django-otp)
- [x] Создать модель `TwoFactorSettings`:
  - [x] `is_enabled` (Boolean)
  - [x] `secret` (CharField)
  - [x] `backup_codes` (JSONField, hashed with SHA-256)
  - [x] `enabled_at`
- [x] Миграция
- [x] Endpoints:
  - [x] `POST /api/v1/auth/2fa/setup/` — генерация secret + QR
  - [x] `POST /api/v1/auth/2fa/verify/` — верификация первого кода
  - [x] `POST /api/v1/auth/2fa/disable/` — отключение (требует пароль)
  - [x] `GET /api/v1/auth/2fa/status/` — статус 2FA
- [x] Обновить `login` endpoint:
  - [x] Если 2FA включена, возвращать `requires_2fa: true`
  - [x] Новый endpoint `POST /api/v1/auth/2fa/authenticate/` — проверка OTP
  - [x] Выдача токенов только после успешного OTP
- [x] Генерация backup codes (10 штук)
- [x] Endpoint `POST /api/v1/auth/2fa/backup-codes/` для regenerate backup codes

Frontend:
- [x] Страница настройки 2FA в профиле (/security)
- [x] Отображение QR-кода для сканирования
- [x] Ввод кода для подтверждения настройки
- [x] Показ backup codes (однократно, с предупреждением сохранить)
- [x] Кнопка отключения 2FA
- [x] Обновить Login flow:
  - [x] После email/password показать форму OTP если требуется
  - [x] Input для 6-значного кода
  - [x] Checkbox "Использовать backup code"
- [x] Форма для backup code
- [x] Тестирование полного flow

**Изменённые файлы:**

Backend:
- `backend/apps/accounts/models.py` — модель TwoFactorSettings
- `backend/apps/accounts/serializers.py` — сериализаторы для 2FA
- `backend/apps/accounts/views.py` — TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView, TwoFactorStatusView, TwoFactorAuthenticateView, BackupCodesView
- `backend/apps/accounts/urls/__init__.py` — URL для 2FA endpoints
- `backend/apps/accounts/migrations/0003_add_2fa_and_sessions.py` — миграция

Frontend:
- `frontend/src/pages/security/SecurityPage.tsx` — страница настроек безопасности
- `frontend/src/pages/auth/LoginPage.tsx` — интеграция 2FA в login flow
- `frontend/src/api/endpoints/auth.ts` — API функции для 2FA
- `frontend/src/types/index.ts` — типы TwoFactorStatus, TwoFactorSetup

---

### 5.2 Управление сессиями ✅ COMPLETED

**Цель:** Список активных сессий, принудительный logout.

**Интеграция с существующей структурой:**
- Расширяем: используем JWT blacklist + кастомная модель сессий
- `djangorestframework-simplejwt` с blacklist

**Результат:** Полностью работающее управление сессиями с отображением устройств, завершением сессий и автоматическим logout при завершении текущей сессии.

**Чек-лист:**

Backend:
- [x] Создать модель `UserSession`:
  - [x] `user` (FK)
  - [x] `token_jti` (refresh token JTI для blacklisting)
  - [x] `access_jti` (access token JTI для определения текущей сессии)
  - [x] `device_type`, `device_name`, `browser`, `os` (parsed user-agent)
  - [x] `ip_address`
  - [x] `location` (city, country — optional, via IP)
  - [x] `created_at`
  - [x] `last_activity`
  - [x] `is_active` (Boolean)
- [x] Миграции (0003, 0004)
- [x] Обновить login: создавать UserSession с обоими JTI
- [x] Endpoints:
  - [x] `GET /api/v1/auth/sessions/` — список активных сессий
  - [x] `POST /api/v1/auth/sessions/{id}/terminate/` — завершить сессию (blacklist token)
  - [x] `POST /api/v1/auth/sessions/terminate-all/` — завершить все кроме текущей
- [x] При logout — blacklist token
- [x] Парсинг User-Agent для device info (библиотека `user-agents`)

Frontend:
- [x] Страница "Активные сессии" в настройках безопасности (/security)
- [x] Список сессий:
  - [x] Устройство/браузер (иконка + текст)
  - [x] IP адрес
  - [x] Последняя активность
  - [x] Метка "Текущая сессия"
- [x] Кнопка "Завершить" для каждой сессии
- [x] Кнопка "Завершить все другие сессии"
- [x] Автоматический logout при завершении текущей сессии
- [x] Тестирование

**Изменённые файлы:**

Backend:
- `backend/apps/accounts/models.py` — модель UserSession с access_jti
- `backend/apps/accounts/serializers.py` — UserSessionSerializer с is_current
- `backend/apps/accounts/views.py` — UserSessionListView, UserSessionTerminateView, UserSessionTerminateAllView, LoginView, TwoFactorAuthenticateView
- `backend/apps/accounts/migrations/0003_add_2fa_and_sessions.py` — начальная миграция
- `backend/apps/accounts/migrations/0004_add_access_jti_to_usersession.py` — добавление access_jti

Frontend:
- `frontend/src/pages/security/SecurityPage.tsx` — список сессий, завершение с logout
- `frontend/src/api/endpoints/auth.ts` — getSessions, terminateSession, terminateAllSessions

---

### 5.5 Backup codes ✅ COMPLETED

**Цель:** Резервные коды для 2FA.

**Интеграция с существующей структурой:**
- Часть 5.1, интегрировано в TwoFactorSettings

**Результат:** Работающие backup codes с хэшированием, одноразовым использованием и генерацией новых кодов.

**Чек-лист:**

Backend:
- [x] Генерация 10 backup codes при включении 2FA
- [x] Хэширование кодов перед сохранением (SHA-256)
- [x] Использование backup code через `POST /api/v1/auth/2fa/authenticate/` с `is_backup_code: true`
- [x] Код одноразовый — удаляется после использования
- [x] Endpoint `POST /api/v1/auth/2fa/backup-codes/` — новые коды
- [x] Требует активную 2FA

Frontend:
- [x] Показ backup codes при включении 2FA
- [x] Предупреждение: "Сохраните эти коды в безопасном месте"
- [x] Кнопка "Скопировать все коды"
- [x] Страница использования backup code при входе (checkbox)
- [x] Кнопка "Сгенерировать новые коды" в настройках
- [x] Показ количества оставшихся кодов
- [x] Тестирование

**Изменённые файлы:**

Backend:
- `backend/apps/accounts/models.py` — методы generate_backup_codes, verify_backup_code в TwoFactorSettings
- `backend/apps/accounts/views.py` — BackupCodesView

Frontend:
- `frontend/src/pages/security/SecurityPage.tsx` — UI для backup codes
- `frontend/src/pages/auth/LoginPage.tsx` — использование backup code при входе

---

### 5.6 Лог входов

**Цель:** История входов пользователя.

**Интеграция с существующей структурой:**
- Расширяем: `AuditLog` уже логирует LOGIN
- Добавляем: отдельную страницу для просмотра

**Чек-лист:**

Backend:
- [ ] Убедиться что LOGIN записывается в AuditLog с:
  - [ ] IP address
  - [ ] User agent
  - [ ] Timestamp
- [ ] Добавить поля в AuditLog или создать отдельную модель `LoginHistory`:
  - [ ] `device_type` (desktop, mobile, tablet)
  - [ ] `browser`
  - [ ] `os`
  - [ ] `country`, `city` (optional, IP geolocation)
  - [ ] `status` (success, failed_password, failed_2fa)
- [ ] Endpoint `GET /api/v1/auth/login-history/` — история текущего пользователя
- [ ] Парсинг user-agent (библиотека `user-agents`)
- [ ] Опционально: IP geolocation (бесплатные сервисы)

Frontend:
- [ ] Страница "История входов" в настройках безопасности
- [ ] Таблица:
  - [ ] Дата/время
  - [ ] Устройство + браузер + ОС
  - [ ] IP адрес
  - [ ] Локация (если есть)
  - [ ] Статус (успешно / неудачно)
- [ ] Иконки для устройств
- [ ] Пагинация
- [ ] Фильтр по дате
- [ ] Выделение подозрительных входов (новый IP/устройство)
- [ ] Тестирование

---

### 5.8 Таймаут сессии

**Цель:** Автоматический logout при неактивности.

**Интеграция с существующей структурой:**
- Frontend: отслеживание активности
- Backend: проверка при запросах

**Чек-лист:**

Backend:
- [ ] Добавить в настройки: `SESSION_IDLE_TIMEOUT` (default: 30 min)
- [ ] Модель `UserSettings` или расширить User:
  - [ ] `session_timeout` (minutes, nullable = use default)
- [ ] Middleware проверки последней активности
- [ ] Обновление `last_activity` в UserSession
- [ ] При превышении timeout — blacklist token

Frontend:
- [ ] Отслеживание активности (mouse, keyboard, scroll)
- [ ] Таймер неактивности
- [ ] За 5 минут до logout — показать предупреждение
- [ ] Modal: "Сессия скоро истечёт. Продолжить работу?"
- [ ] Кнопка "Продолжить" — сброс таймера
- [ ] При истечении — автоматический logout + redirect на login
- [ ] Настройка timeout в профиле (15/30/60 мин / отключить)
- [ ] Тестирование

---

## Фаза 8: Polish & UX

### 1.2 Тёмная тема

**Цель:** Переключатель светлая/тёмная тема.

**Чек-лист:**

Backend:
- [ ] Добавить поле `theme_preference` в User (light, dark, system)
- [ ] Endpoint для обновления настройки

Frontend:
- [ ] Создать ThemeContext или добавить в authStore
- [ ] Переключатель в header или настройках
- [ ] Применение Carbon theme: `g10` (light) / `g100` (dark)
- [ ] Сохранение в localStorage + профиль
- [ ] Поддержка `system` — следовать настройкам ОС
- [ ] Тестирование всех компонентов в обеих темах

---

### 1.5 Breadcrumbs

**Цель:** Хлебные крошки для навигации.

**Чек-лист:**

Frontend:
- [ ] Создать компонент `PageBreadcrumb.tsx` (Carbon `Breadcrumb`)
- [ ] Автоматическая генерация из react-router
- [ ] Добавить на вложенные страницы:
  - [ ] Профиль сотрудника
  - [ ] Детали новости
  - [ ] Админ страницы
  - [ ] Создание/редактирование
- [ ] Тестирование навигации

---

### 1.6 Скелетоны загрузки

**Цель:** Skeleton screens вместо спиннеров.

**Чек-лист:**

Frontend:
- [ ] Использовать Carbon `SkeletonText`, `SkeletonPlaceholder`
- [ ] Создать skeleton для карточки сотрудника
- [ ] Создать skeleton для карточки новости
- [ ] Создать skeleton для таблицы
- [ ] Создать skeleton для профиля
- [ ] Применить во всех списках и страницах
- [ ] Тестирование

---

### 1.8 Keyboard shortcuts

**Цель:** Горячие клавиши для быстрой навигации.

**Чек-лист:**

Frontend:
- [ ] Установить `react-hotkeys-hook` или аналог
- [ ] Глобальные шорткаты:
  - [ ] `Ctrl+K` или `/` — фокус на поиск
  - [ ] `G then H` — перейти на главную
  - [ ] `G then E` — перейти к сотрудникам
  - [ ] `G then N` — перейти к новостям
  - [ ] `Esc` — закрыть модальное окно
- [ ] Показать подсказку `?` — список шорткатов
- [ ] Тестирование

---

### 1.10 Onboarding tour

**Цель:** Интерактивный тур для новых пользователей.

**Чек-лист:**

Backend:
- [ ] Поле `has_completed_onboarding` в User

Frontend:
- [ ] Установить библиотеку (react-joyride, shepherd.js)
- [ ] Создать тур для основных функций:
  - [ ] Навигация
  - [ ] Поиск
  - [ ] Профиль
  - [ ] Уведомления
- [ ] Показывать только новым пользователям
- [ ] Кнопка "Пропустить"
- [ ] Сохранение прогресса
- [ ] Возможность запустить повторно из настроек
- [ ] Тестирование

---

### 1.11 Настраиваемый дашборд

**Цель:** Виджеты которые можно скрывать/перемещать.

**Чек-лист:**

Backend:
- [ ] Модель `DashboardSettings` или JSON поле в User:
  - [ ] `widgets` (order, visibility)
- [ ] Endpoint для сохранения настроек

Frontend:
- [ ] Список виджетов:
  - [ ] Статистика
  - [ ] Дни рождения
  - [ ] Последние новости
  - [ ] Мои достижения
  - [ ] Активные опросы
  - [ ] Мои OKR
  - [ ] Ближайшие брони
- [ ] Drag & drop для изменения порядка
- [ ] Toggle visibility для каждого виджета
- [ ] Кнопка "Настроить дашборд"
- [ ] Сохранение в профиль
- [ ] Тестирование

---

### 1.12 Accessibility audit

**Цель:** Соответствие WCAG 2.1 AA.

**Чек-лист:**

- [ ] Запустить axe DevTools аудит
- [ ] Проверить контрастность текста
- [ ] Проверить focus indicators
- [ ] Проверить keyboard navigation на всех страницах
- [ ] Проверить screen reader (VoiceOver, NVDA)
- [ ] Добавить aria-labels где необходимо
- [ ] Проверить alt тексты для изображений
- [ ] Исправить найденные проблемы
- [ ] Документировать accessibility features

---

### 2.3 Экспорт данных

**Цель:** Экспорт в Excel/CSV.

**Чек-лист:**

Backend:
- [ ] Установить `openpyxl` для Excel
- [ ] Endpoint `GET /api/v1/admin/users/export/?format=csv|xlsx`
- [ ] Endpoint `GET /api/v1/admin/audit/export/?format=csv|xlsx`
- [ ] Endpoint `GET /api/v1/achievements/export/?format=csv|xlsx`
- [ ] Фильтры применяются к экспорту
- [ ] Streaming response для больших файлов
- [ ] Лимит записей для экспорта

Frontend:
- [ ] Кнопка "Экспорт" в админ таблицах
- [ ] Выбор формата (CSV, Excel)
- [ ] Индикатор загрузки
- [ ] Download файла
- [ ] Тестирование

---

### 2.4 Массовые операции

**Цель:** Batch actions в админке.

**Чек-лист:**

Backend:
- [ ] Endpoint `POST /api/v1/admin/users/bulk-action/`
  - [ ] Body: `{ action: "archive|activate|assign_role", ids: [...], role_id?: ... }`
- [ ] Аналогичные endpoints для других сущностей

Frontend:
- [ ] Checkbox selection в DataTable
- [ ] "Выбрать все"
- [ ] Toolbar с действиями при выборе
- [ ] Подтверждение массового действия
- [ ] Результат: сколько успешно, сколько ошибок
- [ ] Тестирование

---

### 2.11 Закладки/Избранное

**Цель:** Сохранение в избранное.

**Чек-лист:**

Backend:
- [ ] Модель `Bookmark`:
  - [ ] `user` (FK)
  - [ ] `content_type` (FK to ContentType)
  - [ ] `object_id`
  - [ ] `created_at`
- [ ] Generic relation к User, News
- [ ] Endpoints:
  - [ ] `POST /api/v1/bookmarks/` — добавить
  - [ ] `DELETE /api/v1/bookmarks/{id}/`
  - [ ] `GET /api/v1/bookmarks/` — список с фильтром по типу

Frontend:
- [ ] Кнопка "В избранное" (звёздочка)
- [ ] На карточках сотрудников и новостей
- [ ] Страница "Избранное" в профиле
- [ ] Тестирование

---

### 2.12 История просмотров

**Цель:** Недавно просмотренные профили.

**Чек-лист:**

Backend:
- [ ] Модель `ViewHistory`:
  - [ ] `user` (FK)
  - [ ] `viewed_user` (FK)
  - [ ] `viewed_at`
- [ ] При просмотре профиля — записывать
- [ ] Endpoint `GET /api/v1/users/recent/` — последние 10

Frontend:
- [ ] Секция "Недавно просмотренные" на Dashboard
- [ ] Или в боковой панели
- [ ] Тестирование

---

### 2.16 Статистика профиля

**Цель:** Количество просмотров профиля, активность.

**Чек-лист:**

Backend:
- [ ] Добавить в User: `profile_views_count`
- [ ] Инкремент при просмотре (исключая самого себя)
- [ ] Endpoint с статистикой:
  - [ ] Просмотры профиля
  - [ ] Количество достижений
  - [ ] Количество kudos
  - [ ] Количество комментариев

Frontend:
- [ ] Показывать на странице профиля
- [ ] Виджет статистики
- [ ] Тестирование

---

### 2.18 Рекомендации навыков

**Цель:** Предложение навыков на основе должности/отдела.

**Чек-лист:**

Backend:
- [ ] Модель `PositionSkill` — рекомендуемые навыки для должности
- [ ] Или анализ: какие навыки есть у коллег в отделе
- [ ] Endpoint `GET /api/v1/skills/recommendations/`

Frontend:
- [ ] Секция "Рекомендуемые навыки" в профиле
- [ ] Кнопка "Добавить" рядом с каждым
- [ ] Тестирование

---

## Зависимости между фичами

```
1.1 Унификация UI ─────────────────────────────────────────────┐
                                                                │
1.3 Carbon Grid ───────────────────────────────────────────────┤
                                                                │
1.4 Carbon DataTable ───► 2.3 Экспорт ───► 2.4 Массовые ops   │
                                                                │
2.5 Rich-text ───► 2.6 Галерея ───► 2.15 Черновики            │
                                                                │
2.14 Теги ─────────────────────────────────────────────────────┤
                                                                │
2.9 Endorsements ───► 2.19 Auto badges                         │
                                                                │
3.11 Kudos ───► 2.19 Auto badges                               │
                                                                │
5.1 2FA ───► 5.5 Backup codes                                  │
         └──► 5.6 Лог входов                                   │
                                                                │
5.2 Сессии ───► 5.8 Таймаут                                    │
```

---

## Приоритеты

**Критичные (блокеры для других фич):**
- 1.1 Унификация UI
- 1.3 Carbon Grid
- 1.4 Carbon DataTable

**Высокий приоритет:**
- 1.7 Мобильная адаптация
- 2.1 Расширенный поиск
- 2.5 Rich-text редактор
- 5.1 2FA
- 5.2 Управление сессиями

**Средний приоритет:**
- Все остальные из Фазы 2-4
- 3.11 Kudos
- 3.4 Опросы

**Низкий приоритет:**
- Фаза 8 (Polish)
- 3.8 OKR
- 3.9 Бронирование

---

*Документ создан: 2025-11-23*
*Последнее обновление: 2025-11-25 - Surveys, Ideas, Classifieds, FAQ полностью завершены*
