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

### 2.17 Матрица навыков отдела

**Цель:** Тепловая карта навыков команды/отдела.

**Интеграция с существующей структурой:**
- Используем: `UserSkill`, `Skill`, `User`, `Department`
- Агрегация по отделу

**Чек-лист:**

Backend:
- [ ] Endpoint `GET /api/v1/organization/departments/{id}/skills-matrix/`
- [ ] Возвращать:
  - [ ] Список навыков (rows)
  - [ ] Список сотрудников отдела (columns)
  - [ ] Матрица: skill_id → user_id → level (null если нет)
- [ ] Агрегированная статистика: сколько человек на каждом уровне
- [ ] Топ-навыки отдела

Frontend:
- [ ] Создать компонент `SkillsMatrix.tsx`
- [ ] Таблица: навыки по вертикали, сотрудники по горизонтали
- [ ] Цветовая индикация уровней (тепловая карта)
- [ ] Легенда уровней
- [ ] Фильтр по категории навыков
- [ ] Интеграция в `OrganizationPage.tsx` — вкладка или секция
- [ ] Или отдельная страница `/organization/departments/{id}/skills`
- [ ] Экспорт в CSV
- [ ] Тестирование на больших отделах

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

### 2.20 Организационная диаграмма

**Цель:** Интерактивная визуализация оргструктуры.

**Интеграция с существующей структурой:**
- Используем: `Department` (иерархическая), `User` (head, manager)
- Библиотека: react-organizational-chart или d3

**Чек-лист:**

Backend:
- [ ] Endpoint `GET /api/v1/organization/tree/`
- [ ] Возвращать nested структуру:
```json
{
  "id": 1,
  "name": "Компания",
  "head": { "id": 1, "name": "CEO", "avatar": "..." },
  "children": [
    {
      "id": 2,
      "name": "Отдел разработки",
      "head": {...},
      "employees_count": 15,
      "children": [...]
    }
  ]
}
```
- [ ] Включать: head, employees_count на каждом уровне

Frontend:
- [ ] Установить библиотеку для org chart
- [ ] Создать компонент `OrgChart.tsx`
- [ ] Карточка узла: название отдела, руководитель (аватар, имя), кол-во сотрудников
- [ ] Expand/collapse узлов
- [ ] Клик по отделу → список сотрудников или переход
- [ ] Клик по руководителю → профиль
- [ ] Zoom и pan для больших структур
- [ ] Интеграция в `OrganizationPage.tsx`
- [ ] Responsive: горизонтальный скролл на mobile
- [ ] Тестирование

---

## Фаза 5: Новые модули

### 3.11 Благодарности (Kudos)

**Цель:** Публичные благодарности коллегам.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/kudos/`
- Похоже на News, но проще
- Связь с Achievements для автоматических бейджей

**Чек-лист:**

Backend:
- [ ] Создать app `kudos`: `python manage.py startapp kudos`
- [ ] Модель `Kudos`:
  - [ ] `sender` (FK to User)
  - [ ] `recipient` (FK to User)
  - [ ] `category` (Choice: help, great_job, initiative, mentorship, teamwork)
  - [ ] `message` (TextField, max 500 chars)
  - [ ] `is_public` (Boolean, default True)
  - [ ] `created_at`
- [ ] Миграция
- [ ] Сериализаторы: `KudosSerializer`, `KudosCreateSerializer`
- [ ] ViewSet с endpoints:
  - [ ] `GET /api/v1/kudos/` — лента (публичные)
  - [ ] `POST /api/v1/kudos/` — отправить
  - [ ] `GET /api/v1/kudos/received/` — полученные текущим пользователем
  - [ ] `GET /api/v1/kudos/sent/` — отправленные
  - [ ] `GET /api/v1/users/{id}/kudos/` — kudos пользователя
- [ ] Фильтры: по категории, по дате, по отделу
- [ ] Нельзя отправить kudos самому себе
- [ ] Уведомление получателю
- [ ] Permissions: все могут отправлять и видеть публичные

Frontend:
- [ ] Создать страницу `KudosPage.tsx` — лента благодарностей
- [ ] Компонент `KudosCard.tsx` — карточка благодарности
- [ ] Компонент `SendKudosModal.tsx`:
  - [ ] Выбор получателя (поиск)
  - [ ] Выбор категории (иконки)
  - [ ] Текст сообщения
- [ ] Кнопка "Отправить благодарность" в header или на dashboard
- [ ] Виджет на Dashboard — последние kudos
- [ ] Секция kudos в профиле пользователя
- [ ] Фильтры на странице kudos
- [ ] Добавить в навигацию
- [ ] Иконки для категорий
- [ ] Тестирование

---

### 3.4 Опросы (Surveys)

**Цель:** Создание опросов, голосований, анонимные и открытые.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/surveys/`
- Связь с User, Department, Role для targeting

**Чек-лист:**

Backend:
- [ ] Создать app `surveys`
- [ ] Модель `Survey`:
  - [ ] `title`
  - [ ] `description`
  - [ ] `author` (FK to User)
  - [ ] `is_anonymous` (Boolean)
  - [ ] `is_required` (Boolean)
  - [ ] `status` (draft, active, closed)
  - [ ] `starts_at`, `ends_at`
  - [ ] `target_type` (all, department, role)
  - [ ] `target_departments` (M2M)
  - [ ] `target_roles` (M2M)
  - [ ] `created_at`
- [ ] Модель `Question`:
  - [ ] `survey` (FK)
  - [ ] `text`
  - [ ] `type` (single_choice, multiple_choice, scale, text, nps)
  - [ ] `is_required`
  - [ ] `order`
- [ ] Модель `QuestionOption`:
  - [ ] `question` (FK)
  - [ ] `text`
  - [ ] `order`
- [ ] Модель `Response`:
  - [ ] `survey` (FK)
  - [ ] `user` (FK, nullable if anonymous)
  - [ ] `created_at`
- [ ] Модель `Answer`:
  - [ ] `response` (FK)
  - [ ] `question` (FK)
  - [ ] `selected_options` (M2M to QuestionOption)
  - [ ] `text_value` (for text questions)
  - [ ] `scale_value` (for scale/nps)
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] CRUD для Survey (admin)
  - [ ] `GET /api/v1/surveys/` — доступные для пользователя
  - [ ] `GET /api/v1/surveys/{id}/` — детали с вопросами
  - [ ] `POST /api/v1/surveys/{id}/respond/` — отправить ответы
  - [ ] `GET /api/v1/surveys/{id}/results/` — результаты (admin)
- [ ] Проверка: пользователь ещё не отвечал
- [ ] Проверка: пользователь в target audience
- [ ] Permissions: создание только для admin/HR

Frontend:
- [ ] Страница `SurveysPage.tsx` — список доступных опросов
- [ ] Страница `SurveyDetailPage.tsx` — прохождение опроса
- [ ] Компоненты для типов вопросов:
  - [ ] `SingleChoiceQuestion.tsx`
  - [ ] `MultipleChoiceQuestion.tsx`
  - [ ] `ScaleQuestion.tsx`
  - [ ] `TextQuestion.tsx`
  - [ ] `NPSQuestion.tsx`
- [ ] Прогресс прохождения
- [ ] Валидация обязательных вопросов
- [ ] Страница благодарности после отправки
- [ ] Админка: создание опроса
- [ ] Админка: конструктор вопросов (drag & drop order)
- [ ] Админка: просмотр результатов с графиками
- [ ] Виджет на Dashboard — активные опросы
- [ ] Уведомления о новых опросах
- [ ] Добавить в навигацию
- [ ] Тестирование

---

### 3.10 Идеи/Предложения

**Цель:** Банк идей от сотрудников с голосованием.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/ideas/`
- Похоже на News + голосование

**Чек-лист:**

Backend:
- [ ] Создать app `ideas`
- [ ] Модель `Idea`:
  - [ ] `title`
  - [ ] `description`
  - [ ] `author` (FK)
  - [ ] `category` (process, product, culture, other)
  - [ ] `status` (new, under_review, approved, in_progress, implemented, rejected)
  - [ ] `admin_comment` (feedback от модератора)
  - [ ] `created_at`, `updated_at`
- [ ] Модель `IdeaVote`:
  - [ ] `idea` (FK)
  - [ ] `user` (FK)
  - [ ] `is_upvote` (Boolean)
  - [ ] Unique: (idea, user)
- [ ] Модель `IdeaComment`:
  - [ ] `idea` (FK)
  - [ ] `author` (FK)
  - [ ] `text`
  - [ ] `created_at`
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] `GET /api/v1/ideas/` — список (с фильтрами, сортировкой)
  - [ ] `POST /api/v1/ideas/` — создать идею
  - [ ] `GET /api/v1/ideas/{id}/`
  - [ ] `PATCH /api/v1/ideas/{id}/` — редактировать (автор или admin)
  - [ ] `POST /api/v1/ideas/{id}/vote/` — голосовать
  - [ ] `DELETE /api/v1/ideas/{id}/vote/` — отменить голос
  - [ ] `PATCH /api/v1/ideas/{id}/status/` — изменить статус (admin)
  - [ ] `GET/POST /api/v1/ideas/{id}/comments/`
- [ ] Сортировка: по голосам, по дате, по статусу
- [ ] Фильтры: категория, статус, автор

Frontend:
- [ ] Страница `IdeasPage.tsx` — список идей
- [ ] Компонент `IdeaCard.tsx` — карточка идеи
- [ ] Голосование: upvote/downvote кнопки
- [ ] Счётчик голосов
- [ ] Страница `IdeaDetailPage.tsx` — детали + комментарии
- [ ] Модальное окно создания идеи
- [ ] Фильтры и сортировка
- [ ] Статус-бейджи
- [ ] Админка: модерация идей, смена статуса
- [ ] Виджет на Dashboard — топ идеи
- [ ] Добавить в навигацию
- [ ] Уведомления: изменение статуса, комментарий к идее
- [ ] Тестирование

---

### 3.14 FAQ / Частые вопросы

**Цель:** Структурированные ответы на типовые вопросы.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/faq/`
- Простая структура: категории → вопросы

**Чек-лист:**

Backend:
- [ ] Создать app `faq`
- [ ] Модель `FAQCategory`:
  - [ ] `name`
  - [ ] `slug`
  - [ ] `order`
  - [ ] `icon` (optional, Carbon icon name)
- [ ] Модель `FAQItem`:
  - [ ] `category` (FK)
  - [ ] `question`
  - [ ] `answer` (TextField, может быть HTML)
  - [ ] `order`
  - [ ] `is_published`
  - [ ] `views_count`
  - [ ] `created_at`, `updated_at`
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] `GET /api/v1/faq/categories/` — категории с вопросами
  - [ ] `GET /api/v1/faq/` — все вопросы (flat)
  - [ ] `GET /api/v1/faq/search/?q=<query>` — поиск
  - [ ] CRUD для admin
- [ ] Инкремент views_count при просмотре
- [ ] Permissions: просмотр для всех, редактирование для admin

Frontend:
- [ ] Страница `FAQPage.tsx`
- [ ] Accordion для вопросов (Carbon Accordion)
- [ ] Группировка по категориям
- [ ] Поиск по FAQ
- [ ] Подсветка результатов поиска
- [ ] "Был ли ответ полезен?" (опционально)
- [ ] Админка: CRUD категорий и вопросов
- [ ] Rich-text для ответов (из 2.5)
- [ ] Добавить в навигацию или footer
- [ ] Тестирование

---

### 3.13 Доска объявлений

**Цель:** Категоризированные объявления от сотрудников.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/classifieds/`
- Личные объявления (не корпоративные)

**Чек-лист:**

Backend:
- [ ] Создать app `classifieds`
- [ ] Модель `ClassifiedCategory`:
  - [ ] `name` (Продам, Куплю, Отдам, Услуги, Попутчики, Хобби, Другое)
  - [ ] `slug`
  - [ ] `icon`
- [ ] Модель `Classified`:
  - [ ] `title`
  - [ ] `description`
  - [ ] `category` (FK)
  - [ ] `author` (FK)
  - [ ] `contact_info` (optional, если отличается от профиля)
  - [ ] `price` (optional, для продажи)
  - [ ] `status` (active, closed, expired)
  - [ ] `expires_at` (автоматически через 30 дней)
  - [ ] `created_at`
- [ ] Модель `ClassifiedImage`:
  - [ ] `classified` (FK)
  - [ ] `image`
  - [ ] `order`
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] `GET /api/v1/classifieds/categories/`
  - [ ] `GET /api/v1/classifieds/` — список (фильтры, пагинация)
  - [ ] `POST /api/v1/classifieds/`
  - [ ] `GET/PATCH/DELETE /api/v1/classifieds/{id}/`
  - [ ] `POST /api/v1/classifieds/{id}/close/` — закрыть
- [ ] Celery task для auto-expire
- [ ] Фильтры: категория, статус

Frontend:
- [ ] Страница `ClassifiedsPage.tsx`
- [ ] Компонент `ClassifiedCard.tsx`
- [ ] Фильтр по категориям (tabs или sidebar)
- [ ] Страница `ClassifiedDetailPage.tsx`
- [ ] Галерея изображений (переиспользовать из 2.6)
- [ ] Форма создания объявления
- [ ] Мои объявления в профиле
- [ ] Добавить в навигацию
- [ ] Тестирование

---

## Фаза 6: OKR & Бронирование

### 3.8 OKR система

**Цель:** Objectives & Key Results для управления целями.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/okr/`
- Связь с User, Department

**Чек-лист:**

Backend:
- [ ] Создать app `okr`
- [ ] Модель `OKRPeriod`:
  - [ ] `name` (Q1 2025, 2025)
  - [ ] `type` (quarter, year)
  - [ ] `starts_at`, `ends_at`
  - [ ] `is_active`
- [ ] Модель `Objective`:
  - [ ] `period` (FK)
  - [ ] `title`
  - [ ] `description`
  - [ ] `level` (company, department, personal)
  - [ ] `owner` (FK to User)
  - [ ] `department` (FK, nullable)
  - [ ] `parent` (FK to self, nullable) — каскадирование
  - [ ] `status` (draft, active, completed, cancelled)
  - [ ] `progress` (computed from KRs)
  - [ ] `created_at`
- [ ] Модель `KeyResult`:
  - [ ] `objective` (FK)
  - [ ] `title`
  - [ ] `type` (quantitative, qualitative)
  - [ ] `target_value` (для количественных)
  - [ ] `current_value`
  - [ ] `unit` (%, штуки, рубли, etc.)
  - [ ] `progress` (0-100, computed или manual)
  - [ ] `order`
- [ ] Модель `CheckIn`:
  - [ ] `key_result` (FK)
  - [ ] `author` (FK)
  - [ ] `previous_value`
  - [ ] `new_value`
  - [ ] `comment`
  - [ ] `created_at`
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] `GET /api/v1/okr/periods/` — периоды
  - [ ] `GET /api/v1/okr/objectives/` — objectives с фильтрами
  - [ ] `POST /api/v1/okr/objectives/`
  - [ ] `GET/PATCH/DELETE /api/v1/okr/objectives/{id}/`
  - [ ] `POST /api/v1/okr/objectives/{id}/key-results/` — добавить KR
  - [ ] `PATCH /api/v1/okr/key-results/{id}/` — обновить KR
  - [ ] `POST /api/v1/okr/key-results/{id}/check-in/` — добавить check-in
  - [ ] `GET /api/v1/okr/my/` — мои OKR
  - [ ] `GET /api/v1/okr/team/` — OKR моей команды
  - [ ] `GET /api/v1/okr/company/` — OKR компании
- [ ] Вычисление progress Objective из KRs
- [ ] Permissions: свои OKR, OKR подчинённых (для менеджеров)

Frontend:
- [ ] Страница `OKRPage.tsx` — обзор OKR
- [ ] Tabs: Мои / Команда / Компания
- [ ] Компонент `ObjectiveCard.tsx`:
  - [ ] Заголовок, описание
  - [ ] Progress bar
  - [ ] Список Key Results
- [ ] Компонент `KeyResultItem.tsx`:
  - [ ] Название, прогресс
  - [ ] Текущее/целевое значение
  - [ ] Кнопка Check-in
- [ ] Модальное окно `CheckInModal.tsx`
- [ ] Визуализация: дерево целей (родитель → дочерние)
- [ ] Форма создания Objective
- [ ] Форма добавления Key Result
- [ ] История check-ins
- [ ] Страница `OKRDetailPage.tsx` — детали objective
- [ ] Дашборд OKR с графиками прогресса
- [ ] Добавить в навигацию
- [ ] Виджет на главную — прогресс личных OKR
- [ ] Тестирование

---

### 3.9 Бронирование ресурсов

**Цель:** Бронирование переговорок, оборудования, рабочих мест.

**Интеграция с существующей структурой:**
- Новый app: `backend/apps/bookings/`
- Связь с User

**Чек-лист:**

Backend:
- [ ] Создать app `bookings`
- [ ] Модель `ResourceType`:
  - [ ] `name` (Переговорная, Оборудование, Рабочее место, Парковка)
  - [ ] `slug`
  - [ ] `icon`
- [ ] Модель `Resource`:
  - [ ] `type` (FK)
  - [ ] `name`
  - [ ] `description`
  - [ ] `location` (этаж, здание)
  - [ ] `capacity` (для переговорок)
  - [ ] `amenities` (JSON: проектор, ВКС, доска, etc.)
  - [ ] `is_active`
  - [ ] `image`
- [ ] Модель `Booking`:
  - [ ] `resource` (FK)
  - [ ] `user` (FK)
  - [ ] `title` (название встречи)
  - [ ] `starts_at`
  - [ ] `ends_at`
  - [ ] `is_recurring` (Boolean)
  - [ ] `recurrence_rule` (JSON: weekly, days, until)
  - [ ] `status` (confirmed, cancelled)
  - [ ] `created_at`
- [ ] Миграции
- [ ] Сериализаторы
- [ ] Endpoints:
  - [ ] `GET /api/v1/bookings/resource-types/`
  - [ ] `GET /api/v1/bookings/resources/` — с фильтрами
  - [ ] `GET /api/v1/bookings/resources/{id}/availability/?date=<date>` — слоты
  - [ ] `GET /api/v1/bookings/` — мои бронирования
  - [ ] `POST /api/v1/bookings/` — создать бронь
  - [ ] `DELETE /api/v1/bookings/{id}/` — отменить
  - [ ] `GET /api/v1/bookings/calendar/?resource={id}&from=<date>&to=<date>`
- [ ] Валидация: нет пересечений по времени
- [ ] Валидация: рабочие часы (9:00-21:00)
- [ ] Валидация: максимальная длительность
- [ ] Уведомления: напоминание за 15 мин (Celery)
- [ ] Celery task для отправки напоминаний

Frontend:
- [ ] Страница `BookingsPage.tsx` — календарь бронирований
- [ ] Компонент `ResourceSelector.tsx` — выбор ресурса
- [ ] Компонент `BookingCalendar.tsx` — недельный/дневной вид
- [ ] Компонент `TimeSlotPicker.tsx` — выбор времени
- [ ] Визуализация занятых слотов
- [ ] Модальное окно создания брони
- [ ] Список ресурсов с фильтрами (тип, вместимость, amenities)
- [ ] Карточка ресурса с фото и описанием
- [ ] Мои бронирования (upcoming, past)
- [ ] Отмена бронирования
- [ ] Повторяющиеся брони (UI для recurrence)
- [ ] Добавить в навигацию
- [ ] Виджет на Dashboard — ближайшие брони
- [ ] Тестирование конфликтов

---

## Фаза 7: Безопасность

### 5.1 2FA (TOTP)

**Цель:** Двухфакторная аутентификация через приложения.

**Интеграция с существующей структурой:**
- Расширяем: `accounts` app
- Библиотеки: `django-otp`, `pyotp`, `qrcode`

**Чек-лист:**

Backend:
- [ ] Установить: `django-otp`, `pyotp`, `qrcode[pil]`
- [ ] Добавить в INSTALLED_APPS: `django_otp`, `django_otp.plugins.otp_totp`
- [ ] Расширить модель `User` или создать `TwoFactorSettings`:
  - [ ] `is_2fa_enabled` (Boolean)
  - [ ] `totp_secret` (CharField, encrypted)
  - [ ] `backup_codes` (JSONField, hashed)
  - [ ] `2fa_enabled_at`
- [ ] Миграция
- [ ] Endpoints:
  - [ ] `POST /api/v1/auth/2fa/setup/` — генерация secret + QR
  - [ ] `POST /api/v1/auth/2fa/verify/` — верификация первого кода
  - [ ] `POST /api/v1/auth/2fa/disable/` — отключение (требует пароль)
  - [ ] `GET /api/v1/auth/2fa/status/` — статус 2FA
- [ ] Обновить `login` endpoint:
  - [ ] Если 2FA включена, возвращать `requires_2fa: true`
  - [ ] Новый endpoint `POST /api/v1/auth/2fa/authenticate/` — проверка OTP
  - [ ] Выдача токенов только после успешного OTP
- [ ] Генерация backup codes (10 штук)
- [ ] Endpoint для regenerate backup codes

Frontend:
- [ ] Страница настройки 2FA в профиле
- [ ] Отображение QR-кода для сканирования
- [ ] Ввод кода для подтверждения настройки
- [ ] Показ backup codes (однократно, с предупреждением сохранить)
- [ ] Кнопка отключения 2FA
- [ ] Обновить Login flow:
  - [ ] После email/password показать форму OTP если требуется
  - [ ] Input для 6-значного кода
  - [ ] Ссылка "Использовать backup code"
- [ ] Форма для backup code
- [ ] Тестирование полного flow

---

### 5.2 Управление сессиями

**Цель:** Список активных сессий, принудительный logout.

**Интеграция с существующей структурой:**
- Расширяем: используем JWT blacklist + кастомная модель сессий
- Или: `djangorestframework-simplejwt` уже поддерживает blacklist

**Чек-лист:**

Backend:
- [ ] Создать модель `UserSession`:
  - [ ] `user` (FK)
  - [ ] `token_id` (jti from JWT)
  - [ ] `device_info` (parsed user-agent)
  - [ ] `ip_address`
  - [ ] `location` (city, country — optional, via IP)
  - [ ] `created_at`
  - [ ] `last_activity`
  - [ ] `is_current` (Boolean)
- [ ] Миграция
- [ ] Обновить login: создавать UserSession
- [ ] Middleware для обновления last_activity
- [ ] Endpoints:
  - [ ] `GET /api/v1/auth/sessions/` — список активных сессий
  - [ ] `DELETE /api/v1/auth/sessions/{id}/` — завершить сессию (blacklist token)
  - [ ] `POST /api/v1/auth/sessions/terminate-all/` — завершить все кроме текущей
- [ ] При logout — удалять/деактивировать сессию
- [ ] Парсинг User-Agent для device info

Frontend:
- [ ] Страница "Активные сессии" в настройках профиля
- [ ] Список сессий:
  - [ ] Устройство/браузер (иконка + текст)
  - [ ] IP адрес
  - [ ] Последняя активность
  - [ ] Метка "Текущая сессия"
- [ ] Кнопка "Завершить" для каждой сессии
- [ ] Кнопка "Завершить все другие сессии"
- [ ] Подтверждение перед действием
- [ ] Тестирование

---

### 5.5 Backup codes

**Цель:** Резервные коды для 2FA.

**Интеграция с существующей структурой:**
- Часть 5.1, но выделено для ясности

**Чек-лист:**

Backend:
- [ ] Генерация 10 backup codes при включении 2FA
- [ ] Хэширование кодов перед сохранением (bcrypt)
- [ ] Endpoint `POST /api/v1/auth/2fa/backup-code/` — использовать код
- [ ] Код одноразовый — удаляется после использования
- [ ] Endpoint `POST /api/v1/auth/2fa/regenerate-backup-codes/` — новые коды
- [ ] Требует подтверждение паролем или OTP

Frontend:
- [ ] Показ backup codes при включении 2FA
- [ ] Предупреждение: "Сохраните эти коды в безопасном месте"
- [ ] Кнопка "Скопировать" / "Скачать"
- [ ] Страница использования backup code при входе
- [ ] Кнопка "Сгенерировать новые коды" в настройках
- [ ] Показ количества оставшихся кодов
- [ ] Тестирование

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
*Последнее обновление: 2025-11-24*
