import styled from '@emotion/styled'
import { StylesProvider } from '@material-ui/core'
import { createHotkey } from '@react-hook/hotkey'
import { collab, getVersion, receiveTransaction, sendableSteps } from 'prosemirror-collab'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import { undo, redo, history } from 'prosemirror-history'
import { undoInputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { Node } from 'prosemirror-model'
import { Transaction } from 'prosemirror-state'
import { Step } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import { createRef } from 'react'
import { hot } from 'react-hot-loader/root'
import { io, Socket } from 'socket.io-client'
import Editor from './Editor'
import Placeholder from './Editor/decorations/Placeholder'
import Manager from './Editor/lib/Manager'
import Bold from './Editor/marks/Bold'
import Code from './Editor/marks/Code'
import Italic from './Editor/marks/Italic'
import Link from './Editor/marks/Link'
import Strikethrough from './Editor/marks/Strikethrough'
import Underline from './Editor/marks/Underline'
import Blockquote from './Editor/nodes/Blockquote'
import BulletList from './Editor/nodes/BulletList'
import CodeBlock from './Editor/nodes/CodeBlock'
import Doc from './Editor/nodes/Doc'
import Heading from './Editor/nodes/Heading'
import ImageBlock from './Editor/nodes/ImageBlock'
import ListItem from './Editor/nodes/ListItem'
import OrderedList from './Editor/nodes/OrderedList'
import Paragraph from './Editor/nodes/Paragraph'
import Text from './Editor/nodes/Text'
import Title from './Editor/nodes/Title'
import TodoItem from './Editor/nodes/TodoItem'
import TodoList from './Editor/nodes/TodoList'
import VideoBlock from './Editor/nodes/VideoBlock'
import DropPasteFile from './Editor/plugins/DropPasteFile'
import Plugins from './Editor/plugins/Plugins'
import Messager from './Messager'
import { notEmpty } from './utils/array'

export interface Config {
  collab?: CollabConfig
  ipfsApi?: string
  ipfsGateway?: string
}

export type CollabConfig = {
  socketIoUri: string
  userId: string
  paperId: string
  accessToken: string
}

export interface MessagerEmitEvents {
  ready: () => void
  persistence: (e: { version: Version; updatedAt: number }) => void
  change: (e: { version: Version }) => void
  titleChange: (e: { title: string }) => void
}

export interface MessagerReservedEvents {
  init: (config?: Config) => void
  save: () => void
}

export type Version = number

export type DocJson = { [key: string]: any }

export type ClientID = string | number

export interface CollabEmitEvents {
  transaction: (e: { version: Version; steps: DocJson[] }) => void
  save: () => void
}

export interface CollabListenEvents {
  paper: (e: { clientID: ClientID; version: Version; doc: DocJson }) => void
  transaction: (e: { version: Version; steps: DocJson[]; clientIDs: ClientID[] }) => void
  persistence: (e: { version: Version; updatedAt: number }) => void
}

export const App = hot(() => {
  return (
    <StylesProvider injectFirst>
      <_App />
    </StylesProvider>
  )
})

class _App extends React.PureComponent<{}> {
  private config?: Config

  private messager = new Messager<{}, MessagerEmitEvents, MessagerReservedEvents>()

  private editor = createRef<Editor>()

  private manager?: Manager

  private collabClient?: Socket<CollabListenEvents, CollabEmitEvents>

  private _title?: string
  private set title(title: string) {
    if (this._title !== title) {
      this._title = title
      this.messager.emit('titleChange', { title })
    }
  }

  private get editorView() {
    return this.editor.current?.editorView
  }

  constructor(props: {}) {
    super(props)

    this.messager.on('init', config => {
      this.config = config

      if (!this.config?.collab) {
        this.initManager({})
        return
      }

      const { socketIoUri, accessToken, userId, paperId } = this.config.collab
      this.collabClient = io(socketIoUri, { query: { accessToken, userId, paperId } })
      this.collabClient.on('paper', ({ version, doc, clientID }) => {
        this.initManager({ doc, collab: { version, clientID } })
      })
      this.collabClient.on('transaction', ({ steps, clientIDs }) => {
        const { editorView } = this
        if (editorView) {
          const { state } = editorView
          const tr = receiveTransaction(
            state,
            steps.map(i => Step.fromJSON(state.schema, i)),
            clientIDs
          )
          editorView.updateState(state.apply(tr))
        }
      })
      this.collabClient.on('persistence', e => this.messager.emit('persistence', e))
    })

    this.messager.on('save', this.save)

    this.messager.emit('ready')
  }

  componentDidMount() {
    window.addEventListener('keydown', e => {
      createHotkey(['mod', 's'], e => {
        e.preventDefault()
        this.save()
      })(e)
    })
  }

  componentWillUnmount() {
    this.messager.dispose()
  }

  private save = () => {
    this.collabClient?.emit('save')
  }

  private initManager(e: { doc?: DocJson; collab?: { version: Version; clientID: ClientID } }) {
    const { ipfsApi, ipfsGateway } = this.config || {}
    const uploadOptions =
      ipfsApi && ipfsGateway
        ? {
            upload: async (file: File) => {
              const form = new FormData()
              form.append('file', file)
              const res = await fetch(`${ipfsApi}/api/v0/add`, {
                method: 'POST',
                body: form,
              })
              const json = await res.json()
              return json.Hash
            },
            getSrc: (hash: string) => {
              return `${ipfsGateway}/ipfs/${hash}`
            },
          }
        : undefined

    const imageBlock = uploadOptions && new ImageBlock(uploadOptions)
    const videoBlock = uploadOptions && new VideoBlock(uploadOptions)

    const extensions = [
      new Placeholder(),

      new Doc(),
      new Text(),
      new Title(),
      new Paragraph(),
      new Heading(),
      new Blockquote(),
      new TodoList(),
      new TodoItem({ todoItemReadOnly: false }),
      new OrderedList(),
      new BulletList(),
      new ListItem(),
      new CodeBlock({ clientID: e.collab?.clientID }),

      new Link(),
      new Bold(),
      new Italic(),
      new Code(),
      new Underline(),
      new Strikethrough(),

      new Plugins(
        [
          keymap({
            'Mod-z': undo,
            'Mod-y': redo,
            Backspace: undoInputRule,
          }),
          keymap(baseKeymap),
          history(),
          gapCursor(),
          dropCursor({ color: 'currentColor' }),
          e.collab && collab({ version: e.collab.version, clientID: e.collab.clientID }),
        ].filter(notEmpty)
      ),

      imageBlock,
      videoBlock,

      new DropPasteFile({
        fileToNode: (view, file) => {
          if (imageBlock && file.type.startsWith('image/')) {
            const node = view.state.schema.nodes[imageBlock.name].create({
              src: null,
              caption: file.name,
            })
            node.file = file
            return node
          } else if (videoBlock && file.type.startsWith('video/')) {
            const node = view.state.schema.nodes[videoBlock.name].create({
              src: null,
              caption: file.name,
            })
            node.file = file
            return node
          }
          return
        },
      }),
    ]

    this.manager = new Manager(extensions.filter(notEmpty), e.doc)
    this.forceUpdate()
  }

  private dispatchTransaction = (tr: Transaction) => {
    const { editorView, collabClient } = this
    if (!editorView) {
      return
    }
    const newState = editorView.state.apply(tr)
    editorView.updateState(newState)

    let sendable: ReturnType<typeof sendableSteps>
    if (collabClient && (sendable = sendableSteps(newState))) {
      editorView.updateState(
        editorView.state.apply(
          receiveTransaction(
            editorView.state,
            sendable.steps,
            new Array(sendable.steps.length).fill(sendable.clientID)
          )
        )
      )

      collabClient.emit('transaction', {
        version: getVersion(newState),
        steps: sendable.steps,
      })
    }

    if (tr.docChanged) {
      const version = getVersion(editorView.state)
      this.messager.emit('change', { version })

      const title = this.getDocTitle(this.editorView?.state.doc)
      if (title !== undefined) {
        this.title = title
      }
    }
  }

  private onEditorInited = (editorView: EditorView) => {
    this.title = this.getDocTitle(editorView.state.doc) ?? ''
  }

  private getDocTitle(doc?: Node) {
    const titleNode = doc?.firstChild?.type.name === 'title' ? doc.firstChild : undefined
    return titleNode?.textContent
  }

  render() {
    const { editor, manager } = this

    if (!manager) {
      return null
    }

    return (
      <_Editor
        ref={editor}
        autoFocus
        manager={manager}
        dispatchTransaction={this.dispatchTransaction}
        onInited={this.onEditorInited}
      />
    )
  }
}

const _Editor = styled(Editor)`
  .ProseMirror {
    min-height: 100vh;
    padding: 8px;
    padding-bottom: 100px;
    max-width: 800px;
    margin: auto;
  }
`

if (process.env.NODE_ENV === 'development') {
  const search = new URLSearchParams(window.location.search)
  const socketIoUri = search.get('socketIoUri')
  const accessToken = search.get('accessToken')
  const userId = search.get('userId')
  const paperId = search.get('paperId')

  const collab: CollabConfig | undefined =
    socketIoUri && accessToken && userId && paperId
      ? {
          socketIoUri,
          accessToken,
          userId,
          paperId,
        }
      : undefined

  const ipfsApi = search.get('ipfsApi')
  const ipfsGateway = search.get('ipfsGateway')

  const config: Config | undefined =
    collab || ipfsApi || ipfsGateway
      ? {
          ipfsApi: ipfsApi || undefined,
          ipfsGateway: ipfsGateway || undefined,
          collab,
        }
      : undefined

  if (config) {
    setTimeout(() => {
      window.postMessage(['init', config], '*')
    })
  }
}
