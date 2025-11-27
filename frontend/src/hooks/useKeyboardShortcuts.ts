import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  description: string
  action: () => void
}

// Check if user is typing in an input field
const isTyping = (): boolean => {
  const activeElement = document.activeElement
  if (!activeElement) return false

  const tagName = activeElement.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  // Check for contenteditable
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true
  }

  return false
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  // Define shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts (with 'g' prefix - Gmail style)
    {
      key: 'g h',
      description: 'Перейти на главную',
      action: () => navigate('/'),
    },
    {
      key: 'g e',
      description: 'Перейти к сотрудникам',
      action: () => navigate('/employees'),
    },
    {
      key: 'g n',
      description: 'Перейти к новостям',
      action: () => navigate('/news'),
    },
    {
      key: 'g a',
      description: 'Перейти к достижениям',
      action: () => navigate('/achievements'),
    },
    {
      key: 'g k',
      description: 'Перейти к благодарностям',
      action: () => navigate('/kudos'),
    },
    {
      key: 'g s',
      description: 'Перейти к опросам',
      action: () => navigate('/surveys'),
    },
    {
      key: 'g i',
      description: 'Перейти к идеям',
      action: () => navigate('/ideas'),
    },
    {
      key: 'g o',
      description: 'Перейти к структуре',
      action: () => navigate('/organization'),
    },
    {
      key: 'g p',
      description: 'Перейти к профилю',
      action: () => navigate('/profile'),
    },
    // Quick actions
    {
      key: '/',
      description: 'Фокус на поиске',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], .cds--search-input')
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      key: 'Escape',
      description: 'Закрыть модальное окно / сбросить фокус',
      action: () => {
        // Blur any focused element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      },
    },
    {
      key: '?',
      shift: true,
      description: 'Показать/скрыть справку',
      action: () => {
        // Toggle help modal - dispatch custom event
        window.dispatchEvent(new CustomEvent('toggleKeyboardHelp'))
      },
    },
  ]

  // Track key sequence for multi-key shortcuts (like 'g h')
  let keySequence: string[] = []
  let keySequenceTimeout: ReturnType<typeof setTimeout> | null = null

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing
    if (isTyping() && event.key !== 'Escape') {
      return
    }

    // Build key string
    let keyString = event.key.toLowerCase()

    // Special case for '?' which requires shift
    if (event.key === '?') {
      keyString = '?'
    }

    // Clear sequence timeout and add key to sequence
    if (keySequenceTimeout) {
      clearTimeout(keySequenceTimeout)
    }
    keySequence.push(keyString)

    // Set timeout to reset sequence
    keySequenceTimeout = setTimeout(() => {
      keySequence = []
    }, 1000)

    // Check for matching shortcut
    const sequenceString = keySequence.join(' ')

    for (const shortcut of shortcuts) {
      // Check modifiers
      if (shortcut.ctrl && !event.ctrlKey) continue
      if (shortcut.alt && !event.altKey) continue
      if (shortcut.shift && !event.shiftKey) continue

      // Check key match
      if (shortcut.key === sequenceString || shortcut.key === keyString) {
        event.preventDefault()
        shortcut.action()
        keySequence = []
        if (keySequenceTimeout) {
          clearTimeout(keySequenceTimeout)
        }
        break
      }
    }
  }, [navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (keySequenceTimeout) {
        clearTimeout(keySequenceTimeout)
      }
    }
  }, [handleKeyDown])

  return { shortcuts }
}

// Export shortcut list for help modal
export const keyboardShortcutsList = [
  { category: 'Навигация', shortcuts: [
    { keys: ['g', 'h'], description: 'Перейти на главную' },
    { keys: ['g', 'e'], description: 'Перейти к сотрудникам' },
    { keys: ['g', 'n'], description: 'Перейти к новостям' },
    { keys: ['g', 'a'], description: 'Перейти к достижениям' },
    { keys: ['g', 'k'], description: 'Перейти к благодарностям' },
    { keys: ['g', 's'], description: 'Перейти к опросам' },
    { keys: ['g', 'i'], description: 'Перейти к идеям' },
    { keys: ['g', 'o'], description: 'Перейти к структуре' },
    { keys: ['g', 'p'], description: 'Перейти к профилю' },
  ]},
  { category: 'Действия', shortcuts: [
    { keys: ['/'], description: 'Фокус на поиске' },
    { keys: ['Esc'], description: 'Закрыть модальное окно' },
    { keys: ['Shift', '?'], description: 'Показать справку' },
  ]},
]
