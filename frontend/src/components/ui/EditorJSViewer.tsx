import { memo, useMemo } from 'react'
import type { OutputData, OutputBlockData } from '@editorjs/editorjs'
import './EditorJSViewer.scss'

interface EditorJSViewerProps {
  content: OutputData | string | null | undefined
  className?: string
}

// List item can be a string or an object with content and nested items
interface ListItem {
  content?: string
  items?: ListItem[]
}

interface BlockData {
  text?: string
  level?: number
  style?: 'unordered' | 'ordered'
  items?: (string | ListItem)[]
  caption?: string
  code?: string
}

// Helper to extract text content from list item
function getItemContent(item: string | ListItem): string {
  if (typeof item === 'string') {
    return item
  }
  return item.content || ''
}

// Helper to get nested items
function getNestedItems(item: string | ListItem): ListItem[] {
  if (typeof item === 'string') {
    return []
  }
  return item.items || []
}

// Recursive list item renderer
function renderListItems(items: (string | ListItem)[], style: 'unordered' | 'ordered'): JSX.Element[] {
  return items.map((item, i) => {
    const content = getItemContent(item)
    const nestedItems = getNestedItems(item)
    const ListTag = style === 'ordered' ? 'ol' : 'ul'

    return (
      <li key={i} className="editorjs-list-item">
        <span dangerouslySetInnerHTML={{ __html: content }} />
        {nestedItems.length > 0 && (
          <ListTag className="editorjs-list editorjs-list--nested">
            {renderListItems(nestedItems, style)}
          </ListTag>
        )}
      </li>
    )
  })
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
      const items = data.items || []
      return (
        <ListTag key={index} className="editorjs-list">
          {renderListItems(items, data.style || 'unordered')}
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
