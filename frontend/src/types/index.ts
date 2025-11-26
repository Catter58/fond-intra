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
  has_completed_onboarding?: boolean
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

export interface DepartmentHeadInfo {
  id: number
  full_name: string
  avatar: string | null
  position: string | null
}

export interface DepartmentTree extends Department {
  head_info: DepartmentHeadInfo | null
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
  endorsements_count: number
  is_endorsed_by_current_user: boolean
}

export interface SkillEndorser {
  id: number
  full_name: string
  avatar: string | null
  position: string | null
}

export interface SkillEndorsement {
  id: number
  user_skill: number
  endorsed_by: number
  endorsed_by_details: SkillEndorser
  skill_name: string
  user_name: string
  created_at: string
}

export interface SkillMatrixUser {
  id: number
  full_name: string
  avatar: string | null
  position: string | null
}

export interface SkillMatrixSkill {
  id: number
  name: string
  category: string
  category_id: number
  users: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert' | null>
  stats: {
    total: number
    beginner: number
    intermediate: number
    advanced: number
    expert: number
  }
}

export interface SkillsMatrix {
  department: {
    id: number
    name: string
  }
  users: SkillMatrixUser[]
  skills: SkillMatrixSkill[]
}

// Achievement types
export type TriggerType =
  | 'comments_count'
  | 'reactions_given'
  | 'reactions_received'
  | 'news_created'
  | 'logins_count'
  | 'profile_views'
  | 'endorsements_received'
  | 'skills_count'
  | 'achievements_count'

export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: 'professional' | 'corporate' | 'social' | 'special'
  category_display: string
  is_active: boolean
  awards_count: number
  is_automatic: boolean
  trigger_type: TriggerType | null
  trigger_type_display: string | null
  trigger_value: number | null
}

export interface TriggerTypeOption {
  value: TriggerType
  label: string
}

export interface AchievementProgress {
  achievement: {
    id: number
    name: string
    description: string
    icon: string
    trigger_value: number
  }
  current_value: number
  is_achieved: boolean
  progress_percentage: number
  remaining: number
}

export interface AchievementProgressGroup {
  trigger_type: TriggerType
  trigger_type_display: string
  current_value: number
  achievements: AchievementProgress[]
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

export interface LeaderboardEntry {
  rank: number
  user: UserBasic
  count: number
  recent_achievement: Achievement | null
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

// Two-Factor Authentication types
export interface TwoFactorStatus {
  is_enabled: boolean
  enabled_at: string | null
  backup_codes_count: number
}

export interface TwoFactorSetup {
  secret: string
  qr_code: string
  provisioning_uri: string
}

// User Session types
export interface UserSession {
  id: number
  device_type: string
  device_name: string
  browser: string
  os: string
  ip_address: string
  location: string
  created_at: string
  last_activity: string
  is_active: boolean
  is_current: boolean
}

// Kudos types
export type KudosCategory = 'help' | 'great_job' | 'initiative' | 'mentorship' | 'teamwork'

export interface KudosUser {
  id: number
  full_name: string
  avatar: string | null
  position: string | null
  department: string | null
}

export interface Kudos {
  id: number
  sender: KudosUser
  recipient: KudosUser
  category: KudosCategory
  category_display: string
  message: string
  is_public: boolean
  created_at: string
}

export interface KudosCategoryOption {
  value: KudosCategory
  label: string
}

export interface KudosStats {
  top_recipients: {
    id: number
    full_name: string
    count: number
  }[]
  category_stats: {
    category: KudosCategory
    label: string
    count: number
  }[]
  total_count: number
}

// Survey types
export type SurveyStatus = 'draft' | 'active' | 'closed'
export type SurveyTargetType = 'all' | 'department' | 'role'
export type QuestionType = 'single_choice' | 'multiple_choice' | 'scale' | 'text' | 'nps'

export interface QuestionOption {
  id: number
  text: string
  order: number
}

export interface Question {
  id: number
  text: string
  type: QuestionType
  is_required: boolean
  order: number
  scale_min: number
  scale_max: number
  scale_min_label: string
  scale_max_label: string
  options: QuestionOption[]
}

export interface Survey {
  id: number
  title: string
  description: string
  author_id?: number
  author_name: string
  status: SurveyStatus
  is_anonymous: boolean
  is_required: boolean
  starts_at: string | null
  ends_at: string | null
  target_type: SurveyTargetType
  questions_count: number
  responses_count: number
  has_responded: boolean
  created_at: string
}

export interface SurveyDetail extends Survey {
  questions: Question[]
}

export interface SurveyAnswer {
  question_id: number
  selected_options?: number[]
  text_value?: string
  scale_value?: number
}

export interface SurveyResponse {
  answers: SurveyAnswer[]
}

export interface OptionStats {
  id: number
  text: string
  count: number
  percentage: number
}

export interface QuestionResults {
  id: number
  text: string
  type: QuestionType
  total_answers: number
  options_stats?: OptionStats[]
  average?: number
  distribution?: Record<number, number>
  nps_score?: number
  text_answers?: string[]
}

export interface SurveyResults {
  total_responses: number
  questions: QuestionResults[]
}

export interface SurveyStatusOption {
  value: SurveyStatus
  label: string
}

export interface QuestionTypeOption {
  value: QuestionType
  label: string
}

export interface TargetTypeOption {
  value: SurveyTargetType
  label: string
}

// Ideas types
export type IdeaCategory = 'process' | 'product' | 'culture' | 'other'
export type IdeaStatus = 'new' | 'under_review' | 'approved' | 'in_progress' | 'implemented' | 'rejected'

export interface IdeaAuthor {
  id: number
  full_name: string
  avatar: string | null
  position: string | null
  department: string | null
}

export interface Idea {
  id: number
  title: string
  description: string
  author: IdeaAuthor
  category: IdeaCategory
  category_display: string
  status: IdeaStatus
  status_display: string
  admin_comment: string
  votes_score: number
  upvotes_count: number
  downvotes_count: number
  comments_count: number
  user_vote: 'up' | 'down' | null
  created_at: string
  updated_at: string
}

export interface IdeaComment {
  id: number
  author: IdeaAuthor
  text: string
  created_at: string
}

export interface IdeaCategoryOption {
  value: IdeaCategory
  label: string
}

export interface IdeaStatusOption {
  value: IdeaStatus
  label: string
}

// FAQ types
export interface FAQCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  order: number
  is_active: boolean
  items_count: number
}

export interface FAQItem {
  id: number
  category: number
  category_name: string
  question: string
  answer: string
  order: number
  is_published: boolean
  views_count: number
  created_at: string
  updated_at: string
}

export interface FAQCategoryWithItems extends FAQCategory {
  items: FAQItem[]
}

// Classifieds types
export type ClassifiedStatus = 'active' | 'closed' | 'expired'

export interface ClassifiedCategory {
  id: number
  name: string
  slug: string
  icon: string
  order: number
  classifieds_count: number
}

export interface ClassifiedAuthor {
  id: number
  full_name: string
  avatar: string | null
  department: string | null
  phone_work: string
  telegram: string
}

export interface ClassifiedImage {
  id: number
  image: string
  order: number
  uploaded_at: string
}

export interface Classified {
  id: number
  title: string
  description: string
  category: number
  category_name: string
  author: ClassifiedAuthor
  contact_info: string
  price: number | null
  status: ClassifiedStatus
  status_display: string
  views_count: number
  images_count?: number
  first_image?: string | null
  images?: ClassifiedImage[]
  expires_at: string | null
  created_at: string
  updated_at?: string
}

// API Response types
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// OKR types
export interface OKRPeriod {
  id: number
  name: string
  type: 'quarter' | 'year'
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
}

export interface OKROwner {
  id: number
  full_name: string
  avatar: string | null
  position_name: string | null
}

export interface KeyResultCheckIn {
  id: number
  new_value: string
  comment: string
  created_at: string
}

export interface KeyResult {
  id: number
  objective: number
  title: string
  type: 'quantitative' | 'qualitative'
  target_value: number | null
  current_value: number
  start_value: number
  unit: string
  progress: number
  order: number
  check_ins_count: number
  last_check_in: KeyResultCheckIn | null
  created_at: string
  updated_at: string
}

export interface Objective {
  id: number
  title: string
  description: string
  level: 'company' | 'department' | 'personal'
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  period: number
  period_name: string
  owner: OKROwner
  department: number | null
  department_name: string | null
  parent: number | null
  parent_title?: string | null
  progress: number
  key_results_count: number
  children_count: number
  key_results?: KeyResult[]
  children?: Objective[]
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: number
  key_result: number
  author: number
  author_name: string
  previous_value: number
  new_value: number
  previous_progress: number
  new_progress: number
  comment: string
  created_at: string
}

export interface ObjectiveTree {
  id: number
  title: string
  level: 'company' | 'department' | 'personal'
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  owner: OKROwner
  progress: number
  children: ObjectiveTree[]
}

export interface OKRLevelOption {
  value: string
  label: string
}

export interface OKRStatusOption {
  value: string
  label: string
}

export interface OKRStatsCheckIn {
  id: number
  key_result_title: string
  objective_title: string
  previous_value: number
  new_value: number
  previous_progress: number
  new_progress: number
  comment: string
  created_at: string
}

export interface OKRStatsObjective {
  id: number
  title: string
  level: 'company' | 'department' | 'personal'
  progress: number
  key_results_count: number
}

export interface OKRStats {
  my_stats: {
    total: number
    active: number
    avg_progress: number
    by_status: Record<string, number>
    by_level: Record<string, number>
  }
  team_stats: {
    total: number
    active: number
    avg_progress: number
  }
  company_stats: {
    total: number
    active: number
    avg_progress: number
  }
  key_results: {
    total: number
    completed: number
    in_progress: number
    not_started: number
  }
  progress_distribution: Record<string, number>
  recent_check_ins: OKRStatsCheckIn[]
  top_objectives: OKRStatsObjective[]
}

// Booking types
export interface ResourceType {
  id: number
  name: string
  slug: string
  icon: string
  description: string
  is_active: boolean
  order: number
  resources_count: number
}

export interface Resource {
  id: number
  name: string
  description: string
  location: string
  capacity: number | null
  amenities: string[]
  image: string | null
  type: number | ResourceType
  type_name?: string
  type_slug?: string
  is_active: boolean
  work_hours_start: string
  work_hours_end: string
  min_booking_duration: number
  max_booking_duration: number
  created_at?: string
  upcoming_bookings?: BookingListItem[]
}

export interface BookingUser {
  id: number
  full_name: string
  avatar: string | null
  department_name: string | null
}

export interface BookingListItem {
  id: number
  title: string
  description: string
  resource: number
  resource_name: string
  resource_type: string
  user: BookingUser
  starts_at: string
  ends_at: string
  status: 'confirmed' | 'cancelled'
  duration_minutes: number
  is_past: boolean
  is_active: boolean
  is_recurring: boolean
  created_at: string
}

export interface RecurrenceRule {
  type: 'weekly' | 'daily'
  days?: number[]
  until?: string
}

export interface Booking extends Omit<BookingListItem, 'resource'> {
  resource: number | Resource
  resource_id?: number
  recurrence_rule: RecurrenceRule | null
  parent_booking: number | null
  updated_at: string
}

export interface TimeSlot {
  start: string
  end: string
  is_available: boolean
  booking_id: number | null
  booking_title: string | null
  booking_user: string | null
}

export interface ResourceAvailability {
  date: string
  resource_id: number
  resource_name: string
  work_hours_start: string
  work_hours_end: string
  slots: TimeSlot[]
}

export interface CalendarBooking {
  id: number
  title: string
  resource: number
  resource_name: string
  starts_at: string
  ends_at: string
  user_name: string
  color: string
}

export interface BookingStats {
  total_bookings: number
  today_bookings: number
  week_bookings: number
  month_bookings: number
  my_upcoming: number
  my_total: number
  by_resource_type: {
    type_id: number
    type_name: string
    type_slug: string
    bookings_count: number
  }[]
}
