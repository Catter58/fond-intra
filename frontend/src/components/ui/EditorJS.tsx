import { useEffect, useRef, useCallback } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import InlineCode from '@editorjs/inline-code'
import Marker from '@editorjs/marker'
import Underline from '@editorjs/underline'
import './EditorJS.scss'

interface RichTextEditorProps {
  data?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  label?: string
  readOnly?: boolean
}

export function RichTextEditor({
  data,
  onChange,
  placeholder = 'Начните писать...',
  label,
  readOnly = false,
}: RichTextEditorProps) {
  const editorInstance = useRef<EditorJS | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const isDataLoaded = useRef(false)
  const skipNextChange = useRef(false)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref updated
  onChangeRef.current = onChange

  // Stable onChange handler
  const handleChange = useCallback(async (api: EditorJS['saver']) => {
    // Skip change events during data loading
    if (skipNextChange.current) {
      skipNextChange.current = false
      return
    }

    if (onChangeRef.current) {
      try {
        const outputData = await api.save()
        onChangeRef.current(outputData)
      } catch (e) {
        console.error('Failed to save editor data:', e)
      }
    }
  }, [])

  // Initialize editor once
  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return

    isInitialized.current = true

    const editor = new EditorJS({
      holder: containerRef.current,
      data: { blocks: [] },
      placeholder,
      readOnly,
      minHeight: 200,
      tools: {
        header: {
          class: Header as any,
          config: {
            levels: [2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: {
          class: List as any,
          inlineToolbar: true,
        },
        quote: {
          class: Quote as any,
          inlineToolbar: true,
        },
        code: Code as any,
        delimiter: Delimiter as any,
        inlineCode: InlineCode as any,
        marker: Marker as any,
        underline: Underline as any,
      },
      onChange: async (api) => {
        handleChange(api.saver)
      },
    })

    editorInstance.current = editor

    return () => {
      if (editorInstance.current?.destroy) {
        editorInstance.current.destroy()
        editorInstance.current = null
        isInitialized.current = false
        isDataLoaded.current = false
      }
    }
  }, [handleChange, placeholder, readOnly])

  // Load data when it arrives (for edit page - data comes async)
  useEffect(() => {
    // Skip if no data or already loaded
    if (!data?.blocks || data.blocks.length === 0) return
    if (isDataLoaded.current) return

    const loadData = async () => {
      if (!editorInstance.current) return

      try {
        await editorInstance.current.isReady
        // Skip the change event that will fire after render
        skipNextChange.current = true
        await editorInstance.current.render(data)
        isDataLoaded.current = true
      } catch (e) {
        console.error('Failed to load editor data:', e)
        skipNextChange.current = false
      }
    }

    loadData()
  }, [data])

  return (
    <div className="editorjs-wrapper">
      {label && <label className="editorjs-label">{label}</label>}
      <div ref={containerRef} className="editorjs-container" />
    </div>
  )
}

export default RichTextEditor
