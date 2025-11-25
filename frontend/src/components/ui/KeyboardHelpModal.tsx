import { useState, useEffect } from 'react'
import { Modal } from '@carbon/react'
import { keyboardShortcutsList } from '@/hooks/useKeyboardShortcuts'

export function KeyboardHelpModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev)
    }

    window.addEventListener('toggleKeyboardHelp', handleToggle)
    return () => {
      window.removeEventListener('toggleKeyboardHelp', handleToggle)
    }
  }, [])

  return (
    <Modal
      open={isOpen}
      onRequestClose={() => setIsOpen(false)}
      modalHeading="Клавиатурные сочетания"
      passiveModal
      size="md"
    >
      <div style={{ padding: '1rem 0' }}>
        {keyboardShortcutsList.map((category) => (
          <div key={category.category} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontWeight: 600,
              marginBottom: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cds-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {category.category}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {category.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--cds-border-subtle-01)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>{shortcut.description}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {shortcut.keys.map((key, index) => (
                      <span key={index}>
                        <kbd
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--cds-layer-02)',
                            border: '1px solid var(--cds-border-subtle-01)',
                            borderRadius: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            minWidth: '1.5rem',
                            textAlign: 'center',
                          }}
                        >
                          {key}
                        </kbd>
                        {index < shortcut.keys.length - 1 && (
                          <span style={{
                            margin: '0 0.25rem',
                            fontSize: '0.75rem',
                            color: 'var(--cds-text-helper)'
                          }}>
                            +
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--cds-text-helper)',
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          Нажмите <kbd style={{
            display: 'inline-block',
            padding: '0.125rem 0.375rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            backgroundColor: 'var(--cds-layer-02)',
            border: '1px solid var(--cds-border-subtle-01)',
            borderRadius: '4px',
          }}>Shift</kbd> + <kbd style={{
            display: 'inline-block',
            padding: '0.125rem 0.375rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            backgroundColor: 'var(--cds-layer-02)',
            border: '1px solid var(--cds-border-subtle-01)',
            borderRadius: '4px',
          }}>?</kbd> в любое время, чтобы открыть это окно
        </p>
      </div>
    </Modal>
  )
}
