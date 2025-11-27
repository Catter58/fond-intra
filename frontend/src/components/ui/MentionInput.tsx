import { useState, useRef, useEffect, useCallback } from 'react'
import { TextInput, Loading } from '@carbon/react'
import { usersApi } from '@/api/endpoints/users'
import type { UserBasic } from '@/types'
import './MentionInput.scss'

interface MentionInputProps {
  id: string
  labelText?: string
  hideLabel?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function MentionInput({
  id,
  labelText = '',
  hideLabel = false,
  value,
  onChange,
  placeholder,
  size = 'sm',
  disabled = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<UserBasic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Extract mention query from cursor position
  const extractMentionQuery = useCallback((text: string, cursorPos: number) => {
    // Look backward from cursor to find @
    let start = cursorPos - 1
    while (start >= 0 && text[start] !== '@' && text[start] !== ' ' && text[start] !== '\n') {
      start--
    }

    if (start >= 0 && text[start] === '@') {
      const query = text.substring(start + 1, cursorPos)
      // Only trigger if query is 1+ chars
      if (query.length >= 1) {
        return { start, query }
      }
    }
    return null
  }, [])

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await usersApi.search(query)
      setSuggestions(results.slice(0, 5))
      setSelectedIndex(0)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart || 0
    const mention = extractMentionQuery(newValue, cursorPos)

    if (mention) {
      setMentionQuery(mention.query)
      setMentionStart(mention.start)
      setShowSuggestions(true)

      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        searchUsers(mention.query)
      }, 200)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // Insert mention
  const insertMention = (user: UserBasic) => {
    if (mentionStart < 0) return

    const before = value.substring(0, mentionStart)
    const after = value.substring(mentionStart + mentionQuery.length + 1)
    const mentionText = `@"${user.full_name}" `
    const newValue = before + mentionText + after

    onChange(newValue)
    setShowSuggestions(false)
    setSuggestions([])

    // Set cursor after mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = before.length + mentionText.length
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current.focus()
      }
    }, 0)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="mention-input">
      <TextInput
        id={id}
        labelText={labelText}
        hideLabel={hideLabel}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        ref={inputRef}
        autoComplete="off"
      />

      {showSuggestions && (
        <div className="mention-suggestions" ref={suggestionsRef}>
          {isLoading ? (
            <div className="mention-suggestions__loading">
              <Loading small withOverlay={false} />
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`mention-suggestions__item ${index === selectedIndex ? 'mention-suggestions__item--selected' : ''}`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="mention-suggestions__avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="mention-suggestions__info">
                  <span className="mention-suggestions__name">{user.full_name}</span>
                  {user.position && (
                    <span className="mention-suggestions__position">{user.position.name}</span>
                  )}
                </div>
              </button>
            ))
          ) : mentionQuery.length >= 1 ? (
            <div className="mention-suggestions__empty">
              Пользователи не найдены
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
