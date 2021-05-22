import React, { createRef } from 'react'
import styled from '@emotion/styled'
import { EditorState, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node, Schema } from 'prosemirror-model'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import 'prosemirror-gapcursor/style/gapcursor.css'
import { inputRules, undoInputRule } from 'prosemirror-inputrules'
import ExtensionManager from './lib/ExtensionManager'
import Placeholder from './decorations/Placeholder'
import Doc from './nodes/Doc'
import Title from './nodes/Title'
import Paragraph from './nodes/Paragraph'
import Heading from './nodes/Heading'
import Text from './nodes/Text'
import Blockquote from './nodes/Blockquote'
import OrderedList from './nodes/OrderedList'
import BulletList from './nodes/BulletList'
import ListItem from './nodes/ListItem'
import CodeBlock from './nodes/CodeBlock'
import ImageBlock, { ImageBlockOptions } from './nodes/ImageBlock'
import Link from './marks/Link'
import Bold from './marks/Bold'
import Italic from './marks/Italic'
import Code from './marks/Code'
import Underline from './marks/Underline'
import Strikethrough from './marks/Strikethrough'
import TodoList from './nodes/TodoList'
import TodoItem from './nodes/TodoItem'
import VideoBlock, { VideoBlockOptions } from './nodes/VideoBlock'

export interface EditorProps {
  className?: string
  value?: Node
  readOnly?: boolean
  autoFocus?: boolean
  todoItemReadOnly?: boolean
  onChange?: (e: { readonly target: { readonly value: Node } }) => void

  imageBlockOptions?: ImageBlockOptions
  videoBlockOptions?: VideoBlockOptions
}

export default class Editor extends React.PureComponent<EditorProps> {
  container = createRef<HTMLDivElement>()
  extensionManager: ExtensionManager

  schema: Schema
  view?: EditorView

  get todoItemReadOnly() {
    return this.props.todoItemReadOnly ?? this.props.readOnly
  }

  constructor(props: EditorProps) {
    super(props)

    const extensions = [
      new Placeholder(),

      new Doc(),
      new Text(),
      new Title(),
      new Paragraph(),
      new Heading(),
      new Blockquote(),
      new TodoList(),
      new TodoItem(this),
      new OrderedList(),
      new BulletList(),
      new ListItem(),
      new CodeBlock(),

      new Link(),
      new Bold(),
      new Italic(),
      new Code(),
      new Underline(),
      new Strikethrough(),
    ]

    if (props.imageBlockOptions) {
      extensions.push(new ImageBlock(props.imageBlockOptions))
    }
    if (props.videoBlockOptions) {
      extensions.push(new VideoBlock(props.videoBlockOptions))
    }

    this.extensionManager = new ExtensionManager(extensions)

    this.schema = new Schema({
      nodes: this.extensionManager.nodeSpecs,
      marks: this.extensionManager.markSpecs,
    })
  }

  componentDidMount() {
    const container = this.container.current
    if (!container) {
      return
    }
    const { schema } = this
    const state = EditorState.create({
      schema,
      doc: this.props.value,
      plugins: [
        inputRules({ rules: this.extensionManager.inputRules({ schema }) }),
        ...this.extensionManager.keymap({ schema }),
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          Backspace: undoInputRule,
        }),
        gapCursor(),
        dropCursor({ color: 'currentColor' }),
        keymap(baseKeymap),
        ...this.extensionManager.plugins,
      ],
    })
    const view = new EditorView(container, {
      state,
      editable: () => !this.props.readOnly,
      nodeViews: this.extensionManager.nodeViews(),
      dispatchTransaction: tr => {
        view.updateState(view.state.apply(tr))
        this.props.onChange?.({ target: { value: view.state.doc } })
      },
    })
    this.view = view
    this.props.autoFocus && this.focus()
  }

  componentDidUpdate(prevProps: EditorProps) {
    if (
      this.view &&
      this.props.value !== prevProps.value &&
      this.props.value !== this.view.state.doc
    ) {
      const { schema, plugins } = this.view.state
      this.view.updateState(EditorState.create({ schema, plugins, doc: this.props.value }))
      this.props.autoFocus && this.focus()
    }
  }

  focus() {
    if (!this.view) {
      return
    }
    const {
      state: { tr, doc },
    } = this.view
    const hasTitle = doc.firstChild?.textContent.trim().length
    if (hasTitle) {
      this.view.dispatch(tr.setSelection(TextSelection.create(doc, doc.content.size)))
    }
    this.view.focus()
  }

  render() {
    const { className } = this.props
    return <_EditorContainer className={className} ref={this.container} />
  }
}

const _EditorContainer = styled.div`
  font-family: 'Chinese Quote', 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji';
  word-wrap: break-word;
  outline-style: none;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.74;
  letter-spacing: 0.008em;

  .ProseMirror {
    outline: none;
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: break-spaces;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    font-feature-settings: 'liga' 0; /* the above doesn't seem to work in Edge */
  }

  .ProseMirror pre {
    white-space: pre-wrap;
  }

  .ProseMirror li {
    position: relative;
  }

  .ProseMirror-hideselection *::selection {
    background: transparent;
  }
  .ProseMirror-hideselection *::-moz-selection {
    background: transparent;
  }
  .ProseMirror-hideselection {
    caret-color: transparent;
  }

  .ProseMirror-selectednode {
    outline: 2px solid #8cf;
  }

  /* Make sure li selections wrap around markers */
  li.ProseMirror-selectednode {
    outline: none;
  }

  li.ProseMirror-selectednode:after {
    content: '';
    position: absolute;
    left: -32px;
    right: -2px;
    top: -2px;
    bottom: -2px;
    border: 2px solid #8cf;
    pointer-events: none;
  }

  ul,
  ol {
    margin: 0 0 0 3px;
    padding: 0;

    li {
      margin-left: 24px;
    }
  }

  ul[data-type='todo_list'] {
    list-style: none;

    > li {
      position: relative;

      > span {
        position: absolute;
        margin-left: -24px;
        left: 0;
        top: 0;

        input {
          width: 14px;
          height: 14px;
          line-height: 14px;
        }
      }

      > div {
        width: 100%;
      }
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0;
    margin-bottom: 0;
    word-spacing: 1px;
    font-weight: bold;
    padding: 0;
  }

  h1 {
    font-size: 28px;
    line-height: 36px;
    margin: 26px 0 10px 0;
  }

  h2 {
    font-size: 24px;
    line-height: 32px;
    margin: 21px 0 5px 0;
  }

  h3 {
    font-size: 20px;
    line-height: 28px;
    margin: 16px 0 5px 0;
  }

  h4 {
    font-size: 16px;
    line-height: 24px;
    margin: 10px 0 5px 0;
  }

  h5 {
    font-size: 15px;
    line-height: 24px;
    margin: 8px 0 5px 0;
  }

  h6 {
    font-size: 15px;
    line-height: 24px;
    font-weight: normal;
    margin: 8px 0 5px 0;
  }

  p {
    margin: 0;
    min-height: 24px;
  }

  blockquote {
    margin: 5px 0;
    padding-left: 1em;
    border-left: 3px solid #eee;
    color: #8c8c8c;
  }

  code {
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace;
    font-size: inherit;
    background-color: rgba(0, 0, 0, 0.06);
    padding: 0 2px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 2px 2px;
    line-height: inherit;
    word-wrap: break-word;
    text-indent: 0;
  }

  a {
    word-wrap: break-word;
    text-decoration: none;
    color: #096dd9;

    &:active {
      text-decoration: none;
      color: #096dd9;
    }

    &:hover {
      text-decoration: none;
      color: #1890ff;
    }
  }

  .ProseMirror-placeholder {
    &:after {
      position: absolute;
      color: #999;
      pointer-events: none;
      content: attr(data-placeholder);
    }
  }

  h1.title {
    margin-top: 8px;
    margin-bottom: 32px;
  }
`
