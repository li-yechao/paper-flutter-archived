import styled from '@emotion/styled'
import { collab, getVersion, receiveTransaction, sendableSteps } from 'prosemirror-collab'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import { undo, redo, history } from 'prosemirror-history'
import { undoInputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { Transaction } from 'prosemirror-state'
import { Step } from 'prosemirror-transform'
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
}

export interface MessagerReservedEvents {
  init: (config?: Config) => void
}

export type Version = number

export type DocJson = { [key: string]: any }

export type ClientID = string | number

export interface CollabEmitEvents {
  transaction: (e: { version: Version; steps: DocJson[]; clientID: ClientID }) => void
}

export interface CollabListenEvents {
  paper: (e: { version: Version; doc: DocJson }) => void
  transaction: (e: { version: Version; steps: DocJson[]; clientIDs: ClientID[] }) => void
}

export const App = hot(() => {
  return <_App />
})

class _App extends React.PureComponent<{}> {
  private config?: Config

  private messager = new Messager<{}, MessagerEmitEvents, MessagerReservedEvents>()

  private editor = createRef<Editor>()

  private manager?: Manager

  private collabClient?: Socket<CollabListenEvents, CollabEmitEvents>

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
      this.collabClient.on('paper', ({ version, doc }) => {
        this.initManager({ doc, collab: { version } })
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
    })

    this.messager.emit('ready')
  }

  componentWillUnmount() {
    this.messager.dispose()
  }

  private initManager(e: { doc?: DocJson; collab?: { version: Version } }) {
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
      new TodoItem(),
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
          e.collab && collab({ version: e.collab.version }),
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
        clientID: sendable.clientID,
      })
    }
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
