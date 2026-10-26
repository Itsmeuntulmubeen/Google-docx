'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Sparkles } from 'lucide-react'

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#cc0000', '#e06666', '#e69138', '#f6b26b',
  '#38761d', '#93c47d', '#1155cc', '#6d9eeb',
  '#45818e', '#76a5af', '#674ea7', '#b4a7d6',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', '#fde68a', '#bbf7d0', '#a7f3d0',
  '#bfdbfe', '#bae6fd', '#ddd6fe', '#fbcfe8',
]

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: '"Times New Roman"' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: '"Courier New"' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS"' },
]

function TBtn({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`h-8 w-8 rounded-md text-[#444746] hover:bg-[#e9eef6] shrink-0 ${
        active ? 'bg-[#d3e3fd] text-[#001d35] hover:bg-[#c2d9fb] hover:text-[#001d35]' : ''
      }`}
    >
      {children}
    </Button>
  )
}

function Divider() {
  return <div className="h-5 w-px bg-[#c4c7c5] mx-1 shrink-0" aria-hidden="true" />
}

export type ToolbarState = {
  canUndo: boolean
  canRedo: boolean
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrike: boolean
  isBullet: boolean
  isOrdered: boolean
  isTask: boolean
  isQuote: boolean
  isCodeBlock: boolean
  headingLevel: 0 | 1 | 2 | 3
  align: 'left' | 'center' | 'right' | 'justify'
  fontFamily: string
  color: string
  isLink: boolean
  linkHref: string
}

export function EditorToolbar({
  editor,
  onOpenAi,
  aiBusy,
}: {
  editor: Editor | null
  onOpenAi: () => void
  aiBusy?: boolean
}) {
  const [colorOpen, setColorOpen] = useState(false)
  const [hlOpen, setHlOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const state = useEditorState({
    editor,
    selector: ({ editor: e }): ToolbarState => {
      if (!e) {
        return {
          canUndo: false, canRedo: false, isBold: false, isItalic: false,
          isUnderline: false, isStrike: false, isBullet: false, isOrdered: false,
          isTask: false, isQuote: false, isCodeBlock: false, headingLevel: 0,
          align: 'left', fontFamily: 'Arial', color: '#000000', isLink: false, linkHref: '',
        }
      }
      const headingLevel = (e.isActive('heading')
        ? (e.getAttributes('heading').level as number)
        : 0) as 0 | 1 | 2 | 3
      return {
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        isBold: e.isActive('bold'),
        isItalic: e.isActive('italic'),
        isUnderline: e.isActive('underline'),
        isStrike: e.isActive('strike'),
        isBullet: e.isActive('bulletList'),
        isOrdered: e.isActive('orderedList'),
        isTask: e.isActive('taskList'),
        isQuote: e.isActive('blockquote'),
        isCodeBlock: e.isActive('codeBlock'),
        headingLevel,
        align: e.isActive({ textAlign: 'center' })
          ? 'center'
          : e.isActive({ textAlign: 'right' })
            ? 'right'
            : e.isActive({ textAlign: 'justify' })
              ? 'justify'
              : 'left',
        fontFamily: (e.getAttributes('textStyle').fontFamily as string) || 'Arial',
        color: (e.getAttributes('textStyle').color as string) || '#000000',
        isLink: e.isActive('link'),
        linkHref: (e.getAttributes('link').href as string) || '',
      }
    },
  })

  if (!editor) return null

  const chain = () => editor.chain().focus()

  const setBlock = (value: string) => {
    if (value === 'p') chain().setParagraph().run()
    else if (value.startsWith('h')) {
      const level = Number(value.slice(1)) as 1 | 2 | 3
      if (state.headingLevel === level) chain().setParagraph().run()
      else chain().setHeading({ level }).run()
    } else if (value === 'quote') chain().toggleBlockquote().run()
    else if (value === 'code') chain().toggleCodeBlock().run()
  }

  const styleValue =
    state.isQuote ? 'quote'
    : state.isCodeBlock ? 'code'
    : state.headingLevel > 0 ? `h${state.headingLevel}`
    : 'p'

  const styleLabel =
    styleValue === 'p' ? 'Normal text'
    : styleValue === 'quote' ? 'Quote'
    : styleValue === 'code' ? 'Code block'
    : `Heading ${styleValue.slice(1)}`

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    const href = /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`
    if (editor.state.selection.empty) {
      chain()
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run()
    } else {
      chain().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkOpen(false)
  }

  const AlignIcon =
    state.align === 'center' ? AlignCenter
    : state.align === 'right' ? AlignRight
    : state.align === 'justify' ? AlignJustify
    : AlignLeft

  return (
    <div className="h-10 flex items-center gap-0.5 px-2 sm:px-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TBtn label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </TBtn>
      <TBtn label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </TBtn>

      <Divider />

      <Select value={styleValue} onValueChange={setBlock}>
        <SelectTrigger
          className="w-[128px] h-8 rounded-md border-0 shadow-none bg-transparent hover:bg-[#e9eef6] focus:ring-0 gap-1 px-2.5 text-[13.5px] text-[#1f1f1f] shrink-0"
          title="Styles"
        >
          <span className="truncate">{styleLabel}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">Normal text</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="quote">Quote</SelectItem>
          <SelectItem value="code">Code block</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={state.fontFamily}
        onValueChange={(v) =>
          v === 'default' ? chain().unsetFontFamily().run() : chain().setFontFamily(v).run()
        }
      >
        <SelectTrigger
          className="hidden md:flex w-[118px] h-8 rounded-md border-0 shadow-none bg-transparent hover:bg-[#e9eef6] focus:ring-0 gap-1 px-2.5 text-[13.5px] text-[#1f1f1f] shrink-0"
          title="Font"
        >
          <span className="truncate">
            {FONT_FAMILIES.find((f) => f.value === state.fontFamily)?.label ?? state.fontFamily}
          </span>
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span style={{ fontFamily: f.value }}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      <TBtn label="Bold" active={state.isBold} onClick={() => chain().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </TBtn>
      <TBtn label="Italic" active={state.isItalic} onClick={() => chain().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </TBtn>
      <TBtn
        label="Underline"
        active={state.isUnderline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </TBtn>
      <TBtn
        label="Strikethrough"
        active={state.isStrike}
        onClick={() => chain().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </TBtn>

      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Text color"
            title="Text color"
            className="h-8 w-8 rounded-md text-[#444746] hover:bg-[#e9eef6] shrink-0 flex-col gap-0.5"
          >
            <span className="text-[13px] font-semibold leading-none font-serif">A</span>
            <span
              className="block h-[3px] w-4 rounded-sm"
              style={{ backgroundColor: state.color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="grid grid-cols-4 gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  chain().setColor(c).run()
                  setColorOpen(false)
                }}
                className="h-6 w-6 rounded border border-black/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                aria-label={`Set text color ${c}`}
              />
            ))}
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              chain().unsetColor().run()
              setColorOpen(false)
            }}
            className="mt-2 w-full text-xs text-[#444746] hover:bg-[#f1f3f4] rounded py-1"
          >
            Reset to default
          </button>
        </PopoverContent>
      </Popover>

      <Popover open={hlOpen} onOpenChange={setHlOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Highlight color"
            title="Highlight color"
            className="h-8 w-8 rounded-md text-[#444746] hover:bg-[#e9eef6] shrink-0"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="grid grid-cols-4 gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  chain().setHighlight({ color: c }).run()
                  setHlOpen(false)
                }}
                className="h-6 w-6 rounded border border-black/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                aria-label={`Highlight ${c}`}
              />
            ))}
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              chain().unsetHighlight().run()
              setHlOpen(false)
            }}
            className="mt-2 w-full text-xs text-[#444746] hover:bg-[#f1f3f4] rounded py-1"
          >
            Remove highlight
          </button>
        </PopoverContent>
      </Popover>

      <Popover
        open={linkOpen}
        onOpenChange={(open) => {
          setLinkOpen(open)
          if (open) setLinkUrl(state.linkHref || '')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Insert link"
            title="Insert link"
            className={`h-8 w-8 rounded-md hover:bg-[#e9eef6] shrink-0 ${
              state.isLink ? 'bg-[#d3e3fd] text-[#001d35]' : 'text-[#444746]'
            }`}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
              placeholder="Paste a link"
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={applyLink} aria-label="Apply link">
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {state.isLink && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                chain().unsetLink().run()
                setLinkOpen(false)
              }}
              className="mt-2 text-xs text-[#444746] hover:bg-[#f1f3f4] rounded py-1 px-2 flex items-center gap-1.5"
            >
              <Unlink className="h-3.5 w-3.5" /> Remove link
            </button>
          )}
        </PopoverContent>
      </Popover>

      <Divider />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Align"
            title="Align"
            className="h-8 w-8 rounded-md text-[#444746] hover:bg-[#e9eef6] shrink-0"
          >
            <AlignIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => chain().setTextAlign('left').run()}>
            <AlignLeft className="h-4 w-4" /> Left
          </DropdownMenuItem>
          <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => chain().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4" /> Center
          </DropdownMenuItem>
          <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => chain().setTextAlign('right').run()}>
            <AlignRight className="h-4 w-4" /> Right
          </DropdownMenuItem>
          <DropdownMenuItem onMouseDown={(e) => e.preventDefault()} onClick={() => chain().setTextAlign('justify').run()}>
            <AlignJustify className="h-4 w-4" /> Justify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TBtn label="Bulleted list" active={state.isBullet} onClick={() => chain().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </TBtn>
      <TBtn label="Numbered list" active={state.isOrdered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </TBtn>
      <TBtn label="Checklist" active={state.isTask} onClick={() => chain().toggleTaskList().run()}>
        <ListChecks className="h-4 w-4" />
      </TBtn>

      <TBtn label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting className="h-4 w-4" />
      </TBtn>

      <div className="flex-1" />

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenAi}
        disabled={aiBusy}
        className="h-8 px-3 shrink-0 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-70"
        aria-label="Open AI assist"
        title="AI Assist"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">AI Assist</span>
      </button>
    </div>
  )
}
