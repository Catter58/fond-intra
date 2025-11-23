import { useEffect, useRef, memo } from 'react'
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

function RichTextEditorComponent({
  data,
  onChange,
  placeholder = 'Начните писать...',
  label,
  readOnly = false,
}: RichTextEditorProps) {
  const editorInstance = useRef<EditorJS | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useRef(false)
  const dataLoaded = useRef(false)

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current || editorInstance.current) return

    const editor = new EditorJS({
      holder: containerRef.current,
      data: data || { blocks: [] },
      placeholder,
      readOnly,
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
      onReady: () => {
        isReady.current = true
        // If we already have data with blocks, mark as loaded
        if (data?.blocks && data.blocks.length > 0) {
          dataLoaded.current = true
        }
      },
      onChange: async (api) => {
        if (onChange) {
          const outputData = await api.saver.save()
          onChange(outputData)
        }
      },
    })

    editorInstance.current = editor

    return () => {
      if (editorInstance.current?.destroy) {
        editorInstance.current.destroy()
        editorInstance.current = null
        isReady.current = false
        dataLoaded.current = false
      }
    }
  }, [])

  // Load data when it arrives (for edit page - data comes async)
  useEffect(() => {
    // Skip if no data or already loaded
    if (!data?.blocks || data.blocks.length === 0) return
    if (dataLoaded.current) return

    const loadData = async () => {
      if (!editorInstance.current) return

      // Wait for editor to be ready
      try {
        await editorInstance.current.isReady
        await editorInstance.current.render(data)
        dataLoaded.current = true
      } catch (e) {
        console.error('Failed to load editor data:', e)
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

export const RichTextEditor = memo(RichTextEditorComponent)
export default RichTextEditor
