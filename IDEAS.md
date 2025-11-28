# Fond Intra — План развития функциональности

Документ содержит детальные чек-листы для реализации новых модулей с учетом текущей архитектуры проекта (Django REST + React + Carbon Design System).

---

## Модуль 1: Корпоративная Wiki / База знаний

### 1.1 Backend: Модели данных

- [ ] Создать Django-приложение `backend/apps/wiki/`
- [ ] Модель `WikiSpace` (пространство знаний)
  - [ ] Поля: name, slug, description, icon, is_public
  - [ ] FK: owner (User), department (nullable)
  - [ ] M2M: allowed_departments, allowed_roles
- [ ] Модель `WikiPage` (страница)
  - [ ] Поля: title, slug, content (JSONField для Editor.js), excerpt, is_published, is_archived
  - [ ] FK: space, author, parent (self-referential для иерархии)
  - [ ] Поля порядка: order, depth
- [ ] Модель `WikiPageVersion` (версии)
  - [ ] Поля: content, change_summary, version_number
  - [ ] FK: page, author
  - [ ] Timestamps: created_at
- [ ] Модель `WikiTag` (теги)
  - [ ] Поля: name, slug, color
  - [ ] M2M связь с WikiPage
- [ ] Модель `WikiAttachment` (вложения)
  - [ ] Поля: file, filename, size, mime_type
  - [ ] FK: page, uploaded_by

### 1.2 Backend: Сериализаторы и Views

- [ ] WikiSpaceSerializer (list, detail, create/update)
- [ ] WikiPageSerializer с nested версиями и тегами
- [ ] WikiPageVersionSerializer
- [ ] WikiTagSerializer
- [ ] ViewSet для WikiSpace с actions: pages, tree
- [ ] ViewSet для WikiPage с actions: versions, restore_version, move
- [ ] Реализовать права доступа (WikiPermission)
  - [ ] Проверка по department/role пользователя
  - [ ] Публичные vs приватные пространства
- [ ] Полнотекстовый поиск по содержимому
  - [ ] PostgreSQL FTS или Elasticsearch
  - [ ] Индексация Editor.js контента (extract_plain_text)

### 1.3 Backend: Дополнительно

- [ ] Сигнал для автосоздания версии при сохранении страницы
- [ ] Celery-задача для индексации поиска
- [ ] API endpoint для экспорта страницы в PDF
- [ ] Миграции с начальными данными (Welcome page)

### 1.4 Frontend: Компоненты

- [ ] `WikiSidebar` — дерево навигации по пространствам и страницам
- [ ] `WikiPageView` — просмотр страницы с EditorJSViewer
- [ ] `WikiPageEditor` — редактирование с Editor.js
- [ ] `WikiVersionHistory` — список версий с diff-просмотром
- [ ] `WikiSearchResults` — результаты поиска с подсветкой
- [ ] `WikiBreadcrumb` — хлебные крошки по иерархии
- [ ] `WikiTagCloud` — облако тегов

### 1.5 Frontend: Страницы

- [ ] `/wiki` — главная страница wiki, список пространств
- [ ] `/wiki/:spaceSlug` — пространство, дерево страниц
- [ ] `/wiki/:spaceSlug/:pageSlug` — просмотр страницы
- [ ] `/wiki/:spaceSlug/:pageSlug/edit` — редактирование
- [ ] `/wiki/:spaceSlug/:pageSlug/history` — история версий
- [ ] `/wiki/search` — глобальный поиск

### 1.6 Frontend: Интеграции

- [ ] Добавить в MainLayout навигацию на Wiki
- [ ] Добавить в GlobalSearch поиск по Wiki
- [ ] Интеграция с системой закладок (Bookmark)
- [ ] Виджет "Последние документы" на дашборде

---

## Модуль 2: Оценка эффективности (Performance Review)

### 2.1 Backend: Модели данных

- [ ] Создать Django-приложение `backend/apps/reviews/`
- [ ] Модель `ReviewCycle` (цикл оценки)
  - [ ] Поля: name, type (quarterly/annual/probation), status (draft/active/completed)
  - [ ] Даты: start_date, end_date, self_review_deadline, peer_review_deadline
- [ ] Модель `ReviewTemplate` (шаблон оценки)
  - [ ] Поля: name, description, is_default
  - [ ] JSON: questions (структура вопросов)
- [ ] Модель `Review` (оценка сотрудника)
  - [ ] FK: cycle, employee (User), manager (User)
  - [ ] Поля: status, overall_rating, summary
- [ ] Модель `ReviewResponse` (ответы 360)
  - [ ] FK: review, reviewer (User)
  - [ ] Поля: relationship (self/peer/manager/subordinate), is_anonymous
  - [ ] JSON: answers
- [ ] Модель `OneOnOne` (встречи 1-on-1)
  - [ ] FK: manager (User), employee (User)
  - [ ] Поля: scheduled_at, duration, status, notes (JSONField), action_items
  - [ ] Связь с Review (optional)
- [ ] Модель `DevelopmentGoal` (цели развития)
  - [ ] FK: user, created_by, linked_objective (OKR, nullable)
  - [ ] Поля: title, description, target_date, status, progress
  - [ ] Категория: skill/competency/career
- [ ] Модель `CareerTrack` (карьерный трек)
  - [ ] FK: user, position (текущая), target_position
  - [ ] Поля: timeline, milestones (JSON)

### 2.2 Backend: Сериализаторы и Views

- [ ] ReviewCycleSerializer, ViewSet с actions: start, complete, stats
- [ ] ReviewSerializer с nested responses
- [ ] ReviewResponseSerializer
- [ ] OneOnOneSerializer, ViewSet с calendar filtering
- [ ] DevelopmentGoalSerializer, связь с OKR Objectives
- [ ] CareerTrackSerializer
- [ ] Permissions: HR может создавать циклы, менеджеры видят подчиненных
- [ ] Celery-задачи: напоминания о дедлайнах, автозакрытие циклов

### 2.3 Backend: Аналитика

- [ ] Endpoint `/reviews/analytics/` — агрегированные данные по циклу
- [ ] Средние оценки по отделам/компетенциям
- [ ] Тренды оценок сотрудника по циклам

### 2.4 Frontend: Компоненты

- [ ] `ReviewCycleCard` — карточка цикла оценки
- [ ] `ReviewForm` — форма заполнения оценки (self/peer/manager)
- [ ] `ReviewSummary` — итоговая сводка для сотрудника
- [ ] `ReviewRadarChart` — радар компетенций
- [ ] `OneOnOneCalendar` — календарь встреч
- [ ] `OneOnOneNotes` — заметки встречи с Editor.js
- [ ] `DevelopmentGoalCard` — карточка цели развития
- [ ] `CareerTimeline` — визуализация карьерного пути

### 2.5 Frontend: Страницы

- [ ] `/reviews` — список циклов оценки (для HR)
- [ ] `/reviews/:cycleId` — детали цикла, участники
- [ ] `/reviews/my` — мои оценки (self-review, peer requests)
- [ ] `/reviews/team` — оценки команды (для менеджеров)
- [ ] `/one-on-ones` — календарь 1-on-1 встреч
- [ ] `/one-on-ones/:id` — детали встречи с заметками
- [ ] `/development` — мои цели развития
- [ ] `/development/:userId` — цели развития сотрудника (для менеджера)
- [ ] `/career` — карьерный трек

### 2.6 Frontend: Интеграции

- [ ] Связь с OKR: выбор Objective как цели развития
- [ ] Виджет "Предстоящие 1-on-1" на дашборде
- [ ] Уведомления о новых peer-review запросах
- [ ] Интеграция с профилем сотрудника

---

## Модуль 3: Расширенная система достижений

### 3.1 Backend: Расширение моделей

- [ ] Расширить модель `Achievement`
  - [ ] Поля: achievement_type (permanent/seasonal/limited)
  - [ ] Даты: available_from, available_until (для сезонных)
  - [ ] Поля: max_awards (лимит выдач), current_awards_count
  - [ ] Поле: rarity (common/uncommon/rare/epic/legendary)
  - [ ] Поле: is_team_achievement (для командных)
- [ ] Модель `AchievementSeason` (сезоны)
  - [ ] Поля: name, theme, start_date, end_date, is_active
  - [ ] M2M: achievements
- [ ] Модель `TeamAchievementProgress` (прогресс команды)
  - [ ] FK: achievement, department
  - [ ] Поля: current_value, target_value, is_completed
- [ ] Расширить `AchievementAward`
  - [ ] Поле: is_featured (для витрины)
  - [ ] Поле: showcase_order

### 3.2 Backend: Логика и сервисы

- [ ] Сервис расчета редкости (% сотрудников с достижением)
- [ ] Celery-задача пересчета rarity при новых выдачах
- [ ] Сервис проверки командных достижений
  - [ ] Триггер при достижении всеми членами отдела
- [ ] Сервис деактивации сезонных достижений по дате
- [ ] Новые trigger_types для автоматических:
  - [ ] team_okr_completed, department_news_count, seasonal_login_streak

### 3.3 Backend: API

- [ ] Endpoint `/achievements/seasons/` — список сезонов
- [ ] Endpoint `/achievements/showcase/` — публичная витрина
- [ ] Endpoint `/achievements/rarity-stats/` — статистика редкости
- [ ] Endpoint `/achievements/team-progress/` — прогресс команды
- [ ] Фильтры: by_rarity, by_season, team_only

### 3.4 Frontend: Компоненты

- [ ] `AchievementShowcase` — публичная витрина с анимациями
- [ ] `AchievementRarityBadge` — индикатор редкости (цвет/иконка)
- [ ] `SeasonBanner` — баннер текущего сезона
- [ ] `TeamAchievementProgress` — прогресс-бар командного достижения
- [ ] `AchievementUnlockAnimation` — анимация получения

### 3.5 Frontend: Страницы

- [ ] `/achievements/showcase` — публичная витрина
- [ ] `/achievements/seasons` — архив сезонов
- [ ] `/achievements/seasons/:id` — достижения сезона
- [ ] Обновить `/achievements` — фильтры по редкости/сезону

### 3.6 Frontend: UX улучшения

- [ ] Toast-уведомление при получении достижения с анимацией
- [ ] Подсветка редких достижений в профиле
- [ ] Счетчик сезонных достижений в header

---

## Модуль 4: Система уровней и опыта (XP)

### 4.1 Backend: Модели данных

- [ ] Модель `UserLevel` (расширение User или отдельная)
  - [ ] Поля: total_xp, current_level, title
  - [ ] FK: user (OneToOne)
- [ ] Модель `LevelDefinition` (определение уровней)
  - [ ] Поля: level_number, required_xp, title, icon, color
  - [ ] JSON: unlocked_features (список разблокируемых функций)
- [ ] Модель `XPTransaction` (история XP)
  - [ ] FK: user, source_type (ContentType), source_id
  - [ ] Поля: amount, action_type, description
  - [ ] Timestamp: created_at
- [ ] Модель `Challenge` (челленджи)
  - [ ] Поля: title, description, type (daily/weekly/monthly/special)
  - [ ] Поля: xp_reward, target_value, start_date, end_date
  - [ ] JSON: criteria (условия выполнения)
- [ ] Модель `UserChallenge` (прогресс челленджа)
  - [ ] FK: user, challenge
  - [ ] Поля: current_value, is_completed, completed_at

### 4.2 Backend: Конфигурация XP

- [ ] Настройки XP за действия (в settings или модели):
  - [ ] comment_created: 5 XP
  - [ ] kudos_sent: 10 XP
  - [ ] kudos_received: 15 XP
  - [ ] idea_submitted: 20 XP
  - [ ] idea_approved: 50 XP
  - [ ] news_published: 30 XP
  - [ ] okr_checkin: 10 XP
  - [ ] achievement_earned: varies by rarity
  - [ ] survey_completed: 15 XP
  - [ ] wiki_page_created: 25 XP

### 4.3 Backend: Сервисы и сигналы

- [ ] Сервис `XPService`
  - [ ] award_xp(user, amount, action_type, source)
  - [ ] check_level_up(user)
  - [ ] get_leaderboard(period, department)
- [ ] Сигналы для начисления XP при действиях
- [ ] Celery-задача обновления челленджей
- [ ] Celery-задача еженедельного/ежемесячного сброса челленджей

### 4.4 Backend: API

- [ ] Endpoint `/xp/my/` — текущий уровень и XP пользователя
- [ ] Endpoint `/xp/history/` — история начислений
- [ ] Endpoint `/xp/leaderboard/` — таблица лидеров
- [ ] Endpoint `/xp/levels/` — список уровней и наград
- [ ] Endpoint `/challenges/` — активные челленджи
- [ ] Endpoint `/challenges/my/` — мои челленджи с прогрессом

### 4.5 Frontend: Компоненты

- [ ] `XPProgressBar` — полоса прогресса до следующего уровня
- [ ] `LevelBadge` — значок уровня с титулом
- [ ] `XPGainToast` — toast при получении XP (+10 XP!)
- [ ] `XPLeaderboard` — таблица лидеров
- [ ] `ChallengeCard` — карточка челленджа с прогрессом
- [ ] `ChallengeList` — список активных челленджей
- [ ] `LevelUpModal` — модалка при повышении уровня

### 4.6 Frontend: Интеграции

- [ ] XP и уровень в профиле пользователя
- [ ] XP и уровень в карточках сотрудников
- [ ] Виджет "Мой прогресс" на дашборде
- [ ] Виджет "Активные челленджи" на дашборде
- [ ] Анимации при получении XP

---

## Модуль 5: HR-аналитика

### 5.1 Backend: Сервисы аналитики

- [ ] Создать `backend/apps/analytics/` или расширить `audit`
- [ ] Сервис `HRAnalyticsService`
  - [ ] get_headcount_by_period(start, end, groupby)
  - [ ] get_turnover_rate(period, department)
  - [ ] get_tenure_distribution()
  - [ ] get_age_distribution()
  - [ ] get_hiring_trends(period)
  - [ ] get_termination_trends(period)
  - [ ] get_department_growth(period)

### 5.2 Backend: Модели (опционально)

- [ ] Модель `EmploymentEvent` (если нет в audit)
  - [ ] Поля: event_type (hired/terminated/transferred/promoted)
  - [ ] FK: user, department, position
  - [ ] Даты: event_date, effective_date
  - [ ] Поля: reason, notes

### 5.3 Backend: API

- [ ] Endpoint `/analytics/hr/headcount/`
- [ ] Endpoint `/analytics/hr/turnover/`
- [ ] Endpoint `/analytics/hr/tenure/`
- [ ] Endpoint `/analytics/hr/demographics/`
- [ ] Endpoint `/analytics/hr/hiring/`
- [ ] Endpoint `/analytics/hr/departures/`
- [ ] Фильтры: period, department, position
- [ ] Permissions: только HR и руководство

### 5.4 Frontend: Компоненты

- [ ] `HeadcountChart` — график численности по времени
- [ ] `TurnoverGauge` — показатель текучести
- [ ] `TenureDistribution` — распределение по стажу (гистограмма)
- [ ] `AgeDistribution` — пирамида возрастов
- [ ] `HiringTrendChart` — тренд найма
- [ ] `DepartmentGrowthChart` — рост отделов

### 5.5 Frontend: Страницы

- [ ] `/admin/analytics/hr` — дашборд HR-аналитики
- [ ] Фильтры по периоду и отделу
- [ ] Экспорт данных в CSV/Excel

---

## Модуль 6: Аналитика вовлеченности

### 6.1 Backend: Сбор данных

- [ ] Middleware или сигналы для трекинга активности
- [ ] Модель `UserActivity` (агрегированная)
  - [ ] FK: user
  - [ ] Поля: date, module, action_count
  - [ ] Индексы для быстрой агрегации
- [ ] Или использовать существующий AuditLog

### 6.2 Backend: Сервисы

- [ ] Сервис `EngagementAnalyticsService`
  - [ ] get_module_activity(period, module)
  - [ ] get_popular_content(type, period, limit)
  - [ ] get_engagement_score(user/department)
  - [ ] get_activity_heatmap(user/department, period)
  - [ ] get_active_users_trend(period)
  - [ ] get_content_engagement(news_id/idea_id)

### 6.3 Backend: Расчет Engagement Score

- [ ] Формула: взвешенная сумма активностей
  - [ ] Логины: вес 1
  - [ ] Просмотры: вес 1
  - [ ] Комментарии: вес 3
  - [ ] Реакции: вес 2
  - [ ] Создание контента: вес 5
  - [ ] Kudos: вес 4
- [ ] Нормализация по отделу/компании
- [ ] Celery-задача ежедневного пересчета

### 6.4 Backend: API

- [ ] Endpoint `/analytics/engagement/overview/`
- [ ] Endpoint `/analytics/engagement/modules/`
- [ ] Endpoint `/analytics/engagement/popular/`
- [ ] Endpoint `/analytics/engagement/score/`
- [ ] Endpoint `/analytics/engagement/heatmap/`
- [ ] Endpoint `/analytics/engagement/trends/`

### 6.5 Frontend: Компоненты

- [ ] `ModuleActivityChart` — активность по модулям (bar chart)
- [ ] `PopularContentList` — топ новостей/идей
- [ ] `EngagementScoreCard` — карточка engagement score
- [ ] `ActivityHeatmap` — тепловая карта (дни/часы)
- [ ] `ActiveUsersTrend` — тренд активных пользователей
- [ ] `DepartmentEngagementComparison` — сравнение отделов

### 6.6 Frontend: Страницы

- [ ] `/admin/analytics/engagement` — дашборд вовлеченности
- [ ] Drill-down по отделам и пользователям

---

## Модуль 7: OKR-аналитика

### 7.1 Backend: Расширение сервисов

- [ ] Сервис `OKRAnalyticsService`
  - [ ] get_completion_rate(period, level, department)
  - [ ] get_historical_trends(periods_count)
  - [ ] get_department_comparison(period)
  - [ ] get_objective_health(objective_id)
  - [ ] predict_completion(objective_id)
  - [ ] get_checkin_frequency(period, user/department)

### 7.2 Backend: Прогнозирование

- [ ] Линейная экстраполяция на основе check-ins
- [ ] Учет исторических данных сотрудника
- [ ] Цветовая индикация: on_track/at_risk/behind

### 7.3 Backend: API

- [ ] Endpoint `/analytics/okr/completion/`
- [ ] Endpoint `/analytics/okr/trends/`
- [ ] Endpoint `/analytics/okr/comparison/`
- [ ] Endpoint `/analytics/okr/predictions/`
- [ ] Endpoint `/analytics/okr/health/`

### 7.4 Frontend: Компоненты

- [ ] `OKRCompletionChart` — процент выполнения по периодам
- [ ] `OKRTrendLine` — исторический тренд
- [ ] `DepartmentOKRComparison` — сравнение отделов (bar chart)
- [ ] `OKRPredictionIndicator` — прогноз выполнения
- [ ] `OKRHealthStatus` — статус здоровья OKR (светофор)
- [ ] `CheckinFrequencyChart` — частота check-ins

### 7.5 Frontend: Страницы

- [ ] `/admin/analytics/okr` — дашборд OKR-аналитики
- [ ] Интеграция в существующий OKRDashboard
- [ ] Drill-down по отделам и сотрудникам

---

## Модуль 8: Дашборд для руководства

### 8.1 Backend: Агрегация данных

- [ ] Endpoint `/analytics/executive/summary/`
  - [ ] Headcount, turnover, engagement score
  - [ ] OKR completion rate
  - [ ] Active users, new hires
  - [ ] Top achievements, kudos stats
- [ ] Модель `ExecutiveWidget` (настройки виджетов)
  - [ ] FK: user
  - [ ] JSON: widgets (список и порядок)
  - [ ] Поля: refresh_interval

### 8.2 Backend: Экспорт отчетов

- [ ] Сервис генерации PDF (WeasyPrint или ReportLab)
- [ ] Шаблоны отчетов (HR, OKR, Engagement)
- [ ] Celery-задача автоматической рассылки
- [ ] Модель `ReportSchedule`
  - [ ] FK: user (получатель)
  - [ ] Поля: report_type, frequency (daily/weekly/monthly), is_active

### 8.3 Backend: API

- [ ] Endpoint `/analytics/executive/`
- [ ] Endpoint `/analytics/reports/generate/`
- [ ] Endpoint `/analytics/reports/schedule/`
- [ ] WebSocket для real-time обновлений (опционально)

### 8.4 Frontend: Компоненты

- [ ] `ExecutiveKPICard` — карточка ключевой метрики
- [ ] `ExecutiveChart` — универсальный график
- [ ] `WidgetConfigurator` — настройка виджетов
- [ ] `ReportGenerator` — модалка генерации отчета
- [ ] `ReportScheduleManager` — управление расписанием

### 8.5 Frontend: Страницы

- [ ] `/admin/executive` — дашборд руководителя
- [ ] Drag-and-drop виджетов (использовать @dnd-kit)
- [ ] Режим редактирования (как на главном дашборде)
- [ ] Настройка автоматических отчетов

### 8.6 Интеграции

- [ ] Email-рассылка отчетов (Celery + Django email)
- [ ] Скачивание PDF прямо из дашборда
- [ ] Шаринг дашборда (публичная ссылка с токеном)

---

## Модуль 9: PWA улучшения

### 9.1 Service Worker

- [ ] Настроить Workbox в Vite (vite-plugin-pwa)
- [ ] Стратегии кэширования:
  - [ ] Static assets: Cache First
  - [ ] API: Network First с fallback
  - [ ] Images: Stale While Revalidate
- [ ] Offline fallback страница

### 9.2 Офлайн-функциональность

- [ ] IndexedDB для хранения данных
  - [ ] Профиль пользователя
  - [ ] Список сотрудников (базовый)
  - [ ] Непрочитанные уведомления
  - [ ] Черновики (комментарии, kudos)
- [ ] Синхронизация при восстановлении связи
- [ ] Индикатор офлайн-режима в UI

### 9.3 Push-уведомления

- [ ] Backend: интеграция с Web Push (pywebpush)
- [ ] Модель `PushSubscription`
  - [ ] FK: user
  - [ ] JSON: subscription (endpoint, keys)
  - [ ] Поля: is_active, created_at
- [ ] API endpoints:
  - [ ] POST `/push/subscribe/`
  - [ ] DELETE `/push/unsubscribe/`
- [ ] Celery-задачи отправки push при:
  - [ ] Новом уведомлении
  - [ ] Новом kudos
  - [ ] Упоминании в комментарии
  - [ ] Напоминании о бронировании
- [ ] Frontend: запрос разрешения на push
- [ ] Frontend: обработка входящих push

### 9.4 Manifest и установка

- [ ] Обновить manifest.json
  - [ ] Иконки всех размеров (512, 384, 256, 192, 144, 96, 72, 48)
  - [ ] shortcuts для быстрых действий
  - [ ] screenshots для install prompt
- [ ] Shortcuts:
  - [ ] "Отправить kudos" → /kudos?action=send
  - [ ] "Мои OKR" → /okr?tab=my
  - [ ] "Уведомления" → /notifications
- [ ] Install prompt кастомизация
- [ ] Обработка standalone режима

### 9.5 Быстрые действия

- [ ] Floating Action Button (FAB) на мобильных
  - [ ] Отправить kudos
  - [ ] Добавить check-in
  - [ ] Создать закладку
- [ ] Свайп-жесты для списков (удалить, архивировать)
- [ ] Pull-to-refresh

### 9.6 Оптимизация производительности

- [ ] Ленивая загрузка компонентов (React.lazy)
- [ ] Виртуализация длинных списков (react-window)
- [ ] Оптимизация изображений (responsive, lazy loading)
- [ ] Preloading критичных ресурсов

### 9.7 Testing

- [ ] Тестирование в Lighthouse
- [ ] Тестирование офлайн-режима
- [ ] Тестирование push-уведомлений
- [ ] Тестирование установки на iOS/Android

---

## Порядок реализации (рекомендуемый)

### Фаза 1: Фундамент (2-3 недели)
1. PWA улучшения (базовые) — Service Worker, Manifest
2. Система уровней и XP — модели, базовая логика

### Фаза 2: Геймификация (2 недели)
3. Расширенная система достижений
4. Интеграция XP с достижениями

### Фаза 3: Аналитика (3-4 недели)
5. HR-аналитика
6. Аналитика вовлеченности
7. OKR-аналитика
8. Дашборд для руководства

### Фаза 4: Контент и HR (4-5 недель)
9. Корпоративная Wiki
10. Оценка эффективности (Performance Review)

### Фаза 5: Полировка (1-2 недели)
11. PWA: Push-уведомления, офлайн-режим
12. Интеграция всех модулей
13. Тестирование и оптимизация

---

## Технические заметки

### Переиспользование существующих компонентов

- **Editor.js** — для Wiki и заметок 1-on-1
- **AdminDataTable** — для HR-аналитики и отчетов
- **DashboardWidget** — для Executive Dashboard
- **EmptyState** — для новых страниц
- **Skeletons** — для загрузки новых компонентов

### Новые зависимости (предполагаемые)

**Backend:**
- `weasyprint` или `reportlab` — генерация PDF
- `pywebpush` — push-уведомления
- `elasticsearch-dsl` — полнотекстовый поиск (опционально)

**Frontend:**
- `vite-plugin-pwa` — PWA функциональность
- `idb` — IndexedDB wrapper
- `recharts` или `chart.js` — графики для аналитики
- `react-window` — виртуализация списков

### Права доступа (новые permissions)

```
wiki: view, create, edit_own, edit_all, delete, manage_spaces
reviews: view_own, view_team, create_cycle, manage
analytics: view_hr, view_engagement, view_okr, view_executive
xp: view, manage_challenges
```

---

*Документ создан: 2025-11-27*
*Последнее обновление: 2025-11-27*
