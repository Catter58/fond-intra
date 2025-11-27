import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'

// ============================================================================
// Main Portal Tour - shown on first login
// ============================================================================
const MAIN_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Добро пожаловать в Fond Intra!</h3>
        <p>Это корпоративный портал вашей компании. Давайте познакомимся с основными функциями.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Вы можете пропустить обучение и вернуться к нему позже через меню профиля.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  // === Главная страница и виджеты ===
  {
    target: '[href="/"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Главная страница</h4>
        <p>На главной странице расположены виджеты с ключевой информацией: новости, достижения, задачи и статистика.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          <strong>Совет:</strong> Нажмите кнопку "Настроить" в правом верхнем углу главной страницы, чтобы изменить порядок виджетов или скрыть ненужные.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  // === Сотрудники ===
  {
    target: '[href="/employees"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Сотрудники</h4>
        <p>Справочник всех сотрудников компании с контактами, навыками и достижениями.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Используйте фильтры по отделу и должности</li>
          <li>Кликните на карточку для просмотра профиля</li>
          <li>Добавляйте коллег в избранное для быстрого доступа</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Достижения ===
  {
    target: '[href="/achievements"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Достижения</h4>
        <p>Система признания заслуг сотрудников. Здесь вы увидите все доступные награды и свой прогресс.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li><strong>Автоматические</strong> — выдаются за активность на портале</li>
          <li><strong>Ручные</strong> — выдаются руководителями и HR</li>
          <li>Следите за лидербордом и соревнуйтесь с коллегами!</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Новости ===
  {
    target: '[href="/news"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Новости</h4>
        <p>Корпоративные новости и объявления компании.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Оставляйте комментарии и ставьте реакции</li>
          <li>Используйте @упоминания коллег в комментариях</li>
          <li>Добавляйте новости в избранное</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Структура организации ===
  {
    target: '[href="/organization"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Структура организации</h4>
        <p>Интерактивная организационная диаграмма компании.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Просматривайте иерархию отделов</li>
          <li>Кликайте на отделы для просмотра сотрудников</li>
          <li>Используйте масштабирование колёсиком мыши</li>
          <li>Матрица навыков покажет компетенции отдела</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Благодарности ===
  {
    target: '[href="/kudos"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Благодарности</h4>
        <p>Отправляйте благодарности коллегам за помощь и отличную работу!</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Нажмите "Отправить благодарность"</li>
          <li>Выберите коллегу и категорию</li>
          <li>Напишите тёплые слова</li>
          <li>Коллега получит уведомление</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Благодарности видны всем и повышают командный дух!
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  // === Опросы ===
  {
    target: '[href="/surveys"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Опросы</h4>
        <p>Участвуйте в опросах и голосованиях компании.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Отвечайте на активные опросы</li>
          <li>Некоторые опросы анонимны</li>
          <li>Ваше мнение помогает улучшать компанию</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Банк идей ===
  {
    target: '[href="/ideas"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Банк идей</h4>
        <p>Предлагайте идеи по улучшению процессов и голосуйте за предложения коллег.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Создавайте идеи в разных категориях</li>
          <li>Голосуйте "за" или "против"</li>
          <li>Комментируйте и обсуждайте</li>
          <li>Следите за статусом своих идей</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === FAQ ===
  {
    target: '[href="/faq"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>FAQ — Частые вопросы</h4>
        <p>База знаний с ответами на популярные вопросы о компании и рабочих процессах.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Не нашли ответ? Обратитесь в HR или напишите в поддержку.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  // === Объявления ===
  {
    target: '[href="/classifieds"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Объявления</h4>
        <p>Доска объявлений для сотрудников — покупка, продажа, услуги.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Размещайте свои объявления</li>
          <li>Фильтруйте по категориям</li>
          <li>Связывайтесь с авторами напрямую</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === OKR ===
  {
    target: '[href="/okr"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>OKR — Цели и ключевые результаты</h4>
        <p>Система управления целями компании, отделов и личными.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li><strong>Цели (Objectives)</strong> — качественные ориентиры</li>
          <li><strong>Ключевые результаты (Key Results)</strong> — измеримые показатели</li>
          <li>Отслеживайте прогресс через регулярные отчёты</li>
          <li>Смотрите цели команды и компании</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Бронирование ===
  {
    target: '[href="/bookings"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Бронирование</h4>
        <p>Бронируйте переговорные комнаты, оборудование и рабочие места.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Выберите ресурс и свободное время</li>
          <li>Укажите название и описание встречи</li>
          <li>Настройте повторяющиеся бронирования</li>
          <li>Получайте напоминания перед встречей</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Избранное ===
  {
    target: '[href="/bookmarks"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Избранное</h4>
        <p>Быстрый доступ к сохранённым материалам.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Сохраняйте профили коллег</li>
          <li>Добавляйте новости в закладки</li>
          <li>Все избранное в одном месте</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Нажмите иконку закладки на карточке сотрудника или новости.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  // === Профиль ===
  {
    target: '[aria-label="Профиль"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Ваш профиль</h4>
        <p>Управление личными данными и настройками безопасности.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li><strong>Профиль</strong> — фото, контакты, информация</li>
          <li><strong>Навыки</strong> — добавляйте свои компетенции</li>
          <li><strong>Безопасность</strong> — 2FA, активные сессии</li>
          <li><strong>Смена пароля</strong> — регулярно обновляйте</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  // === Уведомления ===
  {
    target: '[aria-label="Уведомления"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Уведомления</h4>
        <p>Центр уведомлений о важных событиях.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Новые достижения и награды</li>
          <li>Упоминания в комментариях</li>
          <li>Ответы на ваши комментарии</li>
          <li>Напоминания о встречах</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Красный индикатор показывает непрочитанные уведомления.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  // === Финальный шаг ===
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Вы готовы к работе!</h3>
        <p>Теперь вы знаете основные функции портала.</p>
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Полезные советы:</p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', margin: 0 }}>
            <li><strong>Shift + ?</strong> — горячие клавиши</li>
            <li><strong>g + h</strong> — перейти на главную</li>
            <li><strong>g + e</strong> — перейти к сотрудникам</li>
            <li><strong>/</strong> — фокус на поиск</li>
          </ul>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Запустить обучение повторно можно в меню профиля → "О портале".
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

// ============================================================================
// Profile Tour - shown on /profile page
// ============================================================================
export const PROFILE_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Ваш профиль</h3>
        <p>Здесь вы можете управлять своей информацией, навыками и достижениями.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.edit-profile-btn',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Редактирование профиля</h4>
        <p>Обновите свою контактную информацию:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Загрузите фото профиля</li>
          <li>Рабочий и личный телефон</li>
          <li>Telegram для быстрой связи</li>
          <li>Дата рождения (коллеги смогут поздравить!)</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/profile/skills"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Навыки</h4>
        <p>Добавьте свои профессиональные навыки и компетенции.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Выберите навык из каталога</li>
          <li>Укажите уровень владения</li>
          <li>Коллеги могут подтвердить ваши навыки</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Подтверждённые навыки отображаются с особой отметкой.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
]

// ============================================================================
// Security Tour - shown on /security page
// ============================================================================
export const SECURITY_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Настройки безопасности</h3>
        <p>Защитите свой аккаунт с помощью двухфакторной аутентификации и контролируйте активные сессии.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Двухфакторная аутентификация (2FA)</h4>
        <p>Дополнительный уровень защиты вашего аккаунта.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Установите приложение-аутентификатор (Google Authenticator, Authy)</li>
          <li>Нажмите "Включить 2FA"</li>
          <li>Отсканируйте QR-код</li>
          <li>Введите код для подтверждения</li>
          <li>Сохраните резервные коды в надёжном месте!</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-support-warning)' }}>
          <strong>Важно:</strong> Резервные коды — единственный способ восстановить доступ при потере телефона.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Активные сессии</h4>
        <p>Контролируйте, где вы вошли в систему.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Просматривайте все активные сессии</li>
          <li>Видите устройство, браузер и IP-адрес</li>
          <li>Завершайте подозрительные сессии кнопкой удаления</li>
          <li>"Завершить все остальные" — выход на всех устройствах кроме текущего</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Заметили незнакомую сессию? Немедленно завершите её и смените пароль.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

// ============================================================================
// Achievements Tour - shown on /achievements page
// ============================================================================
export const ACHIEVEMENTS_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Система достижений</h3>
        <p>Получайте награды за активность и вклад в работу компании!</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.award-button',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Выдача награды</h4>
        <p>Если у вас есть права, вы можете наградить коллегу:</p>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Нажмите "Наградить коллегу"</li>
          <li>Выберите сотрудника</li>
          <li>Выберите тип достижения</li>
          <li>Добавьте комментарий (опционально)</li>
        </ol>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Автоматические достижения</h4>
        <p>Некоторые достижения выдаются автоматически за активность:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Комментируйте новости</li>
          <li>Ставьте реакции</li>
          <li>Создавайте контент</li>
          <li>Подтверждайте навыки коллег</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Следите за прогрессом в блоке справа.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

// ============================================================================
// Dashboard Tour - for widget customization
// ============================================================================
export const DASHBOARD_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Главная страница</h3>
        <p>Это ваш персональный дашборд с ключевой информацией о компании.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.settings-btn',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Настройка виджетов</h4>
        <p>Персонализируйте главную страницу под себя!</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Нажмите "Настроить"</li>
          <li>Перетаскивайте виджеты для изменения порядка</li>
          <li>Скрывайте ненужные виджеты иконкой глаза</li>
          <li>Нажмите "Готово" для сохранения</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Настройки сохраняются и синхронизируются между устройствами.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '.dashboard-widgets-grid',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Виджеты</h4>
        <p>Виджеты показывают актуальную информацию:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li><strong>Статистика</strong> — общие показатели компании</li>
          <li><strong>Новости</strong> — последние публикации</li>
          <li><strong>Достижения</strong> — награды коллег</li>
          <li><strong>Благодарности</strong> — признание в команде</li>
          <li><strong>OKR</strong> — ваши цели и прогресс</li>
          <li><strong>Бронирования</strong> — предстоящие встречи</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
]

// ============================================================================
// Kudos Tour - for /kudos page
// ============================================================================
export const KUDOS_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Благодарности</h3>
        <p>Выражайте признательность коллегам за их помощь и вклад!</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.send-kudos-btn',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Отправить благодарность</h4>
        <p>Как отправить благодарность:</p>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Нажмите кнопку "Отправить благодарность"</li>
          <li>Выберите коллегу из списка</li>
          <li>Выберите категорию (помощь, командная работа и т.д.)</li>
          <li>Напишите сообщение от души</li>
          <li>Отправьте — коллега получит уведомление!</li>
        </ol>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[role="tablist"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Вкладки</h4>
        <p>Переключайтесь между разделами:</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li><strong>Лента</strong> — все благодарности компании</li>
          <li><strong>Полученные</strong> — благодарности вам</li>
          <li><strong>Отправленные</strong> — ваши благодарности другим</li>
        </ul>
      </div>
    ),
    disableBeacon: true,
  },
]

// ============================================================================
// Skills Tour - for profile skills section
// ============================================================================
export const SKILLS_TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Управление навыками</h3>
        <p>Добавляйте свои навыки и получайте подтверждения от коллег!</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.add-skill-btn',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Добавление навыка</h4>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Нажмите "Добавить навык"</li>
          <li>Выберите навык из каталога</li>
          <li>Укажите уровень: начинающий, средний, продвинутый, эксперт</li>
          <li>Навык появится в вашем профиле</li>
        </ol>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Подтверждение навыков</h4>
        <p>Коллеги могут подтвердить ваши навыки, а вы — их.</p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Перейдите в профиль коллеги</li>
          <li>Нажмите "Подтвердить" рядом с навыком</li>
          <li>Количество подтверждений отображается на бейдже</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Чем больше подтверждений — тем выше доверие к вашей экспертизе!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

interface OnboardingTourProps {
  forceRun?: boolean
  onComplete?: () => void
  tourType?: 'main' | 'profile' | 'security' | 'achievements' | 'dashboard' | 'kudos' | 'skills'
}

export function OnboardingTour({
  forceRun = false,
  onComplete,
  tourType = 'main'
}: OnboardingTourProps) {
  const { user, setUser } = useAuthStore()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Select appropriate steps based on tour type
  const getSteps = (): Step[] => {
    switch (tourType) {
      case 'profile': return PROFILE_TOUR_STEPS
      case 'security': return SECURITY_TOUR_STEPS
      case 'achievements': return ACHIEVEMENTS_TOUR_STEPS
      case 'dashboard': return DASHBOARD_TOUR_STEPS
      case 'kudos': return KUDOS_TOUR_STEPS
      case 'skills': return SKILLS_TOUR_STEPS
      default: return MAIN_TOUR_STEPS
    }
  }

  const steps = getSteps()

  const completeMutation = useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: () => {
      if (user) {
        setUser({ ...user, has_completed_onboarding: true })
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      onComplete?.()
    },
  })

  // Start tour for new users on dashboard
  useEffect(() => {
    if (forceRun) {
      setStepIndex(0)
      setRun(true)
      return
    }

    // Only start main tour automatically on dashboard for users who haven't completed onboarding
    if (
      tourType === 'main' &&
      user &&
      !user.has_completed_onboarding &&
      location.pathname === '/'
    ) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user, location.pathname, forceRun, tourType])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data

    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
    }

    // Handle tour completion or skip
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)
      setStepIndex(0)

      // Mark onboarding as completed only for main tour
      if (tourType === 'main' && !user?.has_completed_onboarding) {
        completeMutation.mutate()
      } else {
        onComplete?.()
      }
    }
  }

  // Don't render if user hasn't loaded yet
  if (!user) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress={false}
      callback={handleJoyrideCallback}
      scrollToFirstStep
      disableOverlayClose
      locale={{
        back: 'Назад',
        close: 'Закрыть',
        last: 'Завершить',
        next: `Далее (${stepIndex + 1}/${steps.length})`,
        skip: 'Пропустить',
      }}
      styles={{
        options: {
          primaryColor: '#0f62fe', // Carbon blue
          textColor: '#161616',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(22, 22, 22, 0.7)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '4px',
          padding: '1.5rem',
          maxWidth: '420px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1rem',
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '0.5rem 0',
        },
        buttonNext: {
          backgroundColor: '#0f62fe',
          borderRadius: '0',
          padding: '0.75rem 1rem',
        },
        buttonBack: {
          color: '#0f62fe',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: '#525252',
        },
        spotlight: {
          borderRadius: '4px',
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  )
}

// ============================================================================
// Hook for triggering module-specific tours
// ============================================================================
export function useModuleTour(tourType: OnboardingTourProps['tourType']) {
  const [showTour, setShowTour] = useState(false)
  const storageKey = `fond-intra-tour-${tourType}`

  // Check if this specific tour was shown before
  useEffect(() => {
    const wasShown = localStorage.getItem(storageKey)
    if (!wasShown) {
      // Delay to let page render
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setShowTour(false)
  }

  const resetTour = () => {
    localStorage.removeItem(storageKey)
    setShowTour(true)
  }

  return {
    showTour,
    setShowTour,
    handleComplete,
    resetTour,
    tourType,
  }
}
