// Type declarations for Editor.js plugins without TypeScript support

declare module '@editorjs/marker' {
  import { InlineTool } from '@editorjs/editorjs'
  const Marker: InlineTool
  export default Marker
}

declare module '@editorjs/underline' {
  import { InlineTool } from '@editorjs/editorjs'
  const Underline: InlineTool
  export default Underline
}

declare module '@editorjs/inline-code' {
  import { InlineTool } from '@editorjs/editorjs'
  const InlineCode: InlineTool
  export default InlineCode
}
