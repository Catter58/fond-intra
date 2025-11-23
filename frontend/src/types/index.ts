// User types
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  patronymic: string
  full_name: string
  avatar: string | null
  phone_work: string
  phone_personal?: string
  telegram: string
  birth_date: string | null
  hire_date: string | null
  department: Department | null
  position: Position | null
  manager: UserBasic | null
  current_status: UserStatus | null
  achievements_count: number
  date_joined: string
  bio?: string
  role?: Role
  is_superuser?: boolean
  is_archived?: boolean
}

export interface UserBasic {
  id: number
  email: string
  first_name: string
  last_name: string
  patronymic: string
  full_name: string
  avatar: string | null
  department?: Department | null
  position?: Position | null
  current_status?: UserStatus | null
  role?: Role
  is_superuser?: boolean
  is_archived?: boolean
  hire_date?: string | null
  birth_date?: string | null
  phone_personal?: string
  telegram?: string
  bio?: string
}

export interface UserStatus {
  id: number
  status: 'vacation' | 'sick_leave' | 'business_trip' | 'remote' | 'maternity'
  status_display: string
  start_date: string
  end_date: string | null
  comment: string
  created_by: number
  created_by_name: string
  created_at: string
}

// Organization types
export interface Department {
  id: number
  name: string
  description: string
  parent: number | null
  parent_name: string | null
  head: number | null
  head_name: string | null
  order: number
  employees_count: number
  children?: Department[]
}

export interface Position {
  id: number
  name: string
  description: string
  level: number
}

export interface DepartmentTree extends Department {
  children: DepartmentTree[]
}

// Skills types
export interface SkillCategory {
  id: number
  name: string
  description: string
  order: number
  skills_count: number
}

export interface Skill {
  id: number
  name: string
  category: number
  category_name: string
  description: string
}

export interface UserSkill {
  id: number
  skill: number
  skill_name: string
  skill_category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  level_display: string
}

// Achievement types
export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: 'professional' | 'corporate' | 'social' | 'special'
  category_display: string
  is_active: boolean
  awards_count: number
}

export interface AchievementAward {
  id: number
  achievement: Achievement
  recipient: UserBasic
  awarded_by: UserBasic
  giver: UserBasic  // alias for awarded_by
  comment: string
  awarded_at: string
  created_at: string  // alias for awarded_at
}

// News types
export interface NewsTag {
  id: number
  name: string
  slug: string
  color: 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'teal' | 'magenta'
}

// Editor.js content format
export interface EditorJSBlock {
  id?: string
  type: string
  data: Record<string, unknown>
}

export interface EditorJSContent {
  time?: number
  blocks: EditorJSBlock[]
  version?: string
}

export type NewsStatus = 'draft' | 'scheduled' | 'published'

export interface News {
  id: number
  title: string
  content: EditorJSContent
  author: UserBasic
  tags?: NewsTag[]
  status: NewsStatus
  status_display?: string
  is_pinned: boolean
  is_published: boolean
  publish_at?: string | null
  created_at: string
  updated_at: string
  comments_count: number
  reactions_count: number
  reactions_summary: Record<string, number>
  user_reaction: string | null
  attachments?: NewsAttachment[]
  images?: NewsAttachment[]
  cover_image?: NewsCoverImage | null
}

export interface NewsAttachment {
  id: number
  file: string
  thumbnail?: string | null
  file_name: string
  file_type: string
  file_size: number
  order: number
  is_cover: boolean
  is_image: boolean
  uploaded_at: string
}

export interface NewsCoverImage {
  id: number
  file: string
  thumbnail?: string | null
}

export interface Comment {
  id: number
  author: UserBasic
  parent: number | null
  content: string
  created_at: string
  updated_at: string
  replies: Comment[]
  replies_count: number
}

export interface Reaction {
  id: number
  user: UserBasic
  type: 'like' | 'celebrate' | 'support' | 'insightful'
  type_display: string
  created_at: string
}

// Notification types
export interface Notification {
  id: number
  type: 'birthday' | 'achievement' | 'news' | 'comment' | 'reaction' | 'system'
  type_display: string
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

export interface NotificationSettings {
  birthdays_enabled: boolean
  achievements_enabled: boolean
  news_enabled: boolean
  comments_enabled: boolean
  reactions_enabled: boolean
  email_enabled: boolean
}

// Role types
export interface Permission {
  id: number
  codename: string
  name: string
  description: string
  category: string
  category_display: string
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
  is_system: boolean
  is_admin: boolean
  users_count: number
  created_at: string
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: UserBasic
}

// API Response types
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
