import { Fragment, Node } from 'prosemirror-model'

export type Document = {
  title: string
  content: Block[]
}

export type Block =
  | { heading: Heading }
  | { paragraph: Paragraph }
  | { blockquote: Blockquote }
  | { ordered_list: OrderedList }
  | { bullet_list: BulletList }
  | { todo_list: TodoList }
  | { code_block: CodeBlock }
  | { image_block: ImageBlock }
  | { video_block: VideoBlock }

export type Inline = { text: Text }

function isText(v: Inline): v is { text: Text } {
  return (<{ text: Text }>v).text !== undefined
}
function isHeading(v: Block): v is { heading: Heading } {
  return (<{ heading: Heading }>v).heading !== undefined
}
function isParagraph(v: Block): v is { paragraph: Paragraph } {
  return (<{ paragraph: Paragraph }>v).paragraph !== undefined
}
function isBlockquote(v: Block): v is { blockquote: Blockquote } {
  return (<{ blockquote: Blockquote }>v).blockquote !== undefined
}
function isOrderedList(v: Block): v is { ordered_list: OrderedList } {
  return (<{ ordered_list: OrderedList }>v).ordered_list !== undefined
}
function isBulletList(v: Block): v is { bullet_list: BulletList } {
  return (<{ bullet_list: BulletList }>v).bullet_list !== undefined
}
function isTodoList(v: Block): v is { todo_list: TodoList } {
  return (<{ todo_list: TodoList }>v).todo_list !== undefined
}
function isCodeBlock(v: Block): v is { code_block: CodeBlock } {
  return (<{ code_block: CodeBlock }>v).code_block !== undefined
}
function isImageBlock(v: Block): v is { image_block: ImageBlock } {
  return (<{ image_block: ImageBlock }>v).image_block !== undefined
}
function isVideoBlock(v: Block): v is { video_block: VideoBlock } {
  return (<{ video_block: VideoBlock }>v).video_block !== undefined
}

export interface Text {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  link?: { href: string }
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface Heading {
  level: HeadingLevel
  content: Inline[]
}

export interface Paragraph {
  content: Inline[]
}

export interface Blockquote {
  content: Block[]
}

export interface OrderedList {
  content: { list_item: ListItem }[]
}

export interface BulletList {
  content: { list_item: ListItem }[]
}

export interface ListItem {
  content: Block[]
}

export interface TodoList {
  content: { todo_item: TodoItem }[]
}

export interface TodoItem {
  checked?: boolean
  content: Block[]
}

export interface CodeBlock {
  language?: string | null

  content: { text: Text }[]
}

export interface ImageBlock {
  src?: string | null

  caption?: string | null
}

export interface VideoBlock {
  src?: string | null

  caption?: string | null
}

export function documentToProsemirrorDoc(doc: Document): { [key: string]: any } {
  return {
    type: 'doc',
    content: [
      {
        type: 'title',
        content: doc.title ? [{ type: 'text', text: doc.title }] : [],
      },
      ...parseBlocks(doc.content),
    ],
  }

  function parseBlocks(content: Block[]): any[] {
    return content.map(node => {
      if (isHeading(node)) {
        return {
          type: 'heading',
          attrs: {
            level: node.heading.level,
          },
          content: parseInlines(node.heading.content),
        }
      } else if (isParagraph(node)) {
        return {
          type: 'paragraph',
          content: parseInlines(node.paragraph.content),
        }
      } else if (isBlockquote(node)) {
        return {
          type: 'blockquote',
          content: parseBlocks(node.blockquote.content),
        }
      } else if (isOrderedList(node)) {
        return {
          type: 'ordered_list',
          content: parseListItems(node.ordered_list.content),
        }
      } else if (isBulletList(node)) {
        return {
          type: 'bullet_list',
          content: parseListItems(node.bullet_list.content),
        }
      } else if (isTodoList(node)) {
        return {
          type: 'todo_list',
          content: parseTodoItems(node.todo_list.content),
        }
      } else if (isCodeBlock(node)) {
        return {
          type: 'code_block',
          attrs: { language: node.code_block.language },
          content: parseInlines(node.code_block.content),
        }
      } else if (isImageBlock(node)) {
        return {
          type: 'image_block',
          attrs: { src: node.image_block.src, caption: node.image_block.caption },
        }
      } else if (isVideoBlock(node)) {
        return {
          type: 'video_block',
          attrs: { src: node.video_block.src, caption: node.video_block.caption },
        }
      } else {
        throw new Error(`Unknown block node ${node}`)
      }
    })
  }

  function parseListItems(list: { list_item: ListItem }[]): any[] {
    return list.map(item => ({
      type: 'list_item',
      content: parseBlocks(item.list_item.content),
    }))
  }

  function parseTodoItems(list: { todo_item: TodoItem }[]): any[] {
    return list.map(item => ({
      type: 'todo_item',
      attrs: { checked: item.todo_item.checked },
      content: parseBlocks(item.todo_item.content),
    }))
  }

  function parseInlines(content: Inline[]): any[] {
    return content.map(node => {
      if (isText(node)) {
        const text = {
          type: 'text',
          text: node.text.text,
          marks: <any[]>[],
        }
        if (node.text.bold) {
          text.marks.push({ type: 'bold' })
        }
        if (node.text.italic) {
          text.marks.push({ type: 'italic' })
        }
        if (node.text.underline) {
          text.marks.push({ type: 'underline' })
        }
        if (node.text.strikethrough) {
          text.marks.push({ type: 'strikethrough' })
        }
        if (node.text.code) {
          text.marks.push({ type: 'code' })
        }
        if (node.text.link) {
          text.marks.push({ type: 'link', attrs: { href: node.text.link.href } })
        }
        return text
      } else {
        throw new Error(`Unknown inline node ${node}`)
      }
    })
  }
}

export function prosemirrorDocToDocument(node: Node): Document {
  const title = node.firstChild?.type.name === 'title' ? node.firstChild.textContent : ''

  return {
    title,
    content: parseBlocks(node.content),
  }

  function parseBlocks(content: Fragment): Block[] {
    const res: Block[] = []

    content.forEach(node => {
      switch (node.type.name) {
        case 'title':
          break
        case 'heading':
          res.push({
            heading: { level: node.attrs.level, content: parseInlines(node.content) },
          })
          break
        case 'paragraph':
          res.push({ paragraph: { content: parseInlines(node.content) } })
          break
        case 'blockquote':
          res.push({ blockquote: { content: parseBlocks(node.content) } })
          break
        case 'ordered_list':
          res.push({ ordered_list: { content: parseListItems(node.content) } })
          break
        case 'bullet_list':
          res.push({ bullet_list: { content: parseListItems(node.content) } })
          break
        case 'todo_list':
          res.push({ todo_list: { content: parseTodoItems(node.content) } })
          break
        case 'code_block':
          res.push({
            code_block: {
              language: node.attrs.language,
              content: parseInlines(node.content),
            },
          })
          break
        case 'image_block':
          res.push({
            image_block: {
              src: node.attrs.src,
              caption: node.attrs.caption,
            },
          })
          break
        case 'video_block':
          res.push({
            video_block: {
              src: node.attrs.src,
              caption: node.attrs.caption,
            },
          })
          break
        default:
          throw new Error(`Unknown node type ${node.type.name}`)
      }
    })

    return res
  }

  function parseListItems(content: Fragment): { list_item: ListItem }[] {
    const res: { list_item: ListItem }[] = []

    content.forEach(node => {
      switch (node.type.name) {
        case 'list_item':
          res.push({ list_item: { content: parseBlocks(node.content) } })
          break
        default:
          throw new Error(`Unknown node type ${node.type.name}`)
      }
    })

    return res
  }

  function parseTodoItems(content: Fragment): { todo_item: TodoItem }[] {
    const res: { todo_item: TodoItem }[] = []

    content.forEach(node => {
      switch (node.type.name) {
        case 'todo_item':
          res.push({
            todo_item: { checked: node.attrs.checked === true, content: parseBlocks(node.content) },
          })
          break
        default:
          throw new Error(`Unknown node type ${node.type.name}`)
      }
    })

    return res
  }

  function parseInlines(content: Fragment): Inline[] {
    const res: Inline[] = []

    content.forEach(node => {
      switch (node.type.name) {
        case 'text':
          const text: Text = { text: node.text ?? '' }
          for (const mark of node.marks) {
            switch (mark.type.name) {
              case 'bold':
                text.bold = true
                break
              case 'italic':
                text.italic = true
                break
              case 'underline':
                text.underline = true
                break
              case 'strikethrough':
                text.strikethrough = true
                break
              case 'code':
                text.code = true
                break
              case 'link':
                text.link = { href: mark.attrs.href }
                break
              default:
                throw new Error(`Unknown mark type ${mark.type.name}`)
            }
          }
          res.push({ text })
          break
        default:
          throw new Error(`Unknown node type ${node.type.name}`)
      }
    })

    return res
  }
}
