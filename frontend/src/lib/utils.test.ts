import { describe, it, expect } from 'vitest'
import { getInitials, pluralize } from './utils'

describe('getInitials', () => {
  it('should return initials from full name', () => {
    expect(getInitials('Иван Петров')).toBe('ИП')
  })

  it('should return initials from name with patronymic', () => {
    expect(getInitials('Иван Петрович Сидоров')).toBe('ИП')
  })

  it('should handle single name', () => {
    expect(getInitials('Иван')).toBe('И')
  })

  it('should handle empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('should uppercase initials', () => {
    expect(getInitials('иван петров')).toBe('ИП')
  })
})

describe('pluralize', () => {
  it('should return singular form for 1', () => {
    expect(pluralize(1, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудник')
    expect(pluralize(21, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудник')
    expect(pluralize(101, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудник')
  })

  it('should return few form for 2-4', () => {
    expect(pluralize(2, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудника')
    expect(pluralize(3, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудника')
    expect(pluralize(4, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудника')
    expect(pluralize(22, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудника')
  })

  it('should return many form for 5-20', () => {
    expect(pluralize(5, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
    expect(pluralize(10, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
    expect(pluralize(20, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
  })

  it('should return many form for 11-19', () => {
    expect(pluralize(11, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
    expect(pluralize(12, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
    expect(pluralize(19, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
  })

  it('should handle zero', () => {
    expect(pluralize(0, 'сотрудник', 'сотрудника', 'сотрудников')).toBe('сотрудников')
  })
})
