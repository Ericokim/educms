import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function ToolbarButton({
  editor,
  isActive,
  onClick,
  label,
  children,
}: {
  editor: Editor
  isActive: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      size="icon"
      className="size-8"
      aria-label={label}
      aria-pressed={isActive}
      disabled={!editor.isEditable}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  ariaLabel = 'Post content',
}: {
  value: string
  onChange: (html: string) => void
  ariaLabel?: string
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap-content min-h-48 px-3 py-2 text-sm focus:outline-none',
        'aria-label': ariaLabel,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  // Sync external resets (e.g. loading a post, rollback) into the editor.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === '' && editor.isEmpty)) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]'
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1" role="toolbar" aria-label="Formatting">
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          <Heading3 />
        </ToolbarButton>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Numbered list"
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Quote"
        >
          <Quote />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
