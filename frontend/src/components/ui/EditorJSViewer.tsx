import { memo, useMemo } from 'react'
import type { OutputData, OutputBlockData } from '@editorjs/editorjs'
import './EditorJSViewer.scss'

interface EditorJSViewerProps {
  content: OutputData | string | null | undefined
  className?: string
}

interface BlockData {
  text?: string
  level?: number
  style?: 'unordered' | 'ordered'
  items?: string[]
  caption?: string
  code?: string
}

function renderBlock(block: OutputBlockData<string, BlockData>, index: number): JSX.Element | null {
  const { type, data } = block

  switch (type) {
    case 'paragraph':
      return (
        <p
          key={index}
          className="editorjs-paragraph"
          dangerouslySetInnerHTML={{ __html: data.text || '' }}
        />
      )

    case 'header':
      const Tag = `h${data.level || 2}` as keyof JSX.IntrinsicElements
      return (
        <Tag
          key={index}
          className="editorjs-header"
          dangerouslySetInnerHTML={{ __html: data.text || '' }}
        />
      )

    case 'list':
      const ListTag = data.style === 'ordered' ? 'ol' : 'ul'
      return (
        <ListTag key={index} className="editorjs-list">
          {(data.items || []).map((item, i) => (
            <li
              key={i}
              className="editorjs-list-item"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </ListTag>
      )

    case 'quote':
      return (
        <blockquote key={index} className="editorjs-quote">
          <p dangerouslySetInnerHTML={{ __html: data.text || '' }} />
          {data.caption && (
            <cite dangerouslySetInnerHTML={{ __html: data.caption }} />
          )}
        </blockquote>
      )

    case 'code':
      return (
        <pre key={index} className="editorjs-code">
          <code>{data.code || ''}</code>
        </pre>
      )

    case 'delimiter':
      return <hr key={index} className="editorjs-delimiter" />

    default:
      // For unknown block types, try to render as paragraph
      if (data.text) {
        return (
          <p
            key={index}
            className="editorjs-paragraph"
            dangerouslySetInnerHTML={{ __html: data.text }}
          />
        )
      }
      return null
  }
}

function EditorJSViewerComponent({ content, className = '' }: EditorJSViewerProps) {
  const parsedContent = useMemo(() => {
    if (!content) return null

    // If content is a string, try to parse it as JSON
    if (typeof content === 'string') {
      try {
        return JSON.parse(content) as OutputData
      } catch {
        // If parsing fails, treat it as plain text
        return {
          blocks: [{ type: 'paragraph', data: { text: content } }],
        } as OutputData
      }
    }

    return content
  }, [content])

  if (!parsedContent || !parsedContent.blocks || parsedContent.blocks.length === 0) {
    return null
  }

  return (
    <div className={`editorjs-viewer ${className}`}>
      {parsedContent.blocks.map((block, index) => renderBlock(block as OutputBlockData<string, BlockData>, index))}
    </div>
  )
}

export const RichTextViewer = memo(EditorJSViewerComponent)
export default RichTextViewer
