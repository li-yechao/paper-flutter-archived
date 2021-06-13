import styled from '@emotion/styled'
import { useHotkey } from '@react-hook/hotkey'
import EventEmitter from 'events'
import { collab, receiveTransaction, sendableSteps } from 'prosemirror-collab'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import { undo, redo, history } from 'prosemirror-history'
import { undoInputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { Node } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'
import React, { useCallback, useEffect, useRef } from 'react'
import { hot } from 'react-hot-loader/root'
import { useUpdate } from 'react-use'
import { io, Socket } from 'socket.io-client'
import { CollabOptions, DocJson, EmitEvents, ListenEvents } from './Collab'
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
import { notEmpty } from './utils/array'

export const App = hot(() => {
  const update = useUpdate()
  const editor = useRef<Editor>(null)
  const doc = useRef<Node>()
  const config = useRef<Config>()
  const collabOptions = useRef<CollabOptions>()
  const collabClient = useRef<Socket<ListenEvents, EmitEvents>>()
  const manager = useRef<Manager>()

  const setDoc = useCallback((v: Node) => {
    doc.current = v
    update()
    Message.instance.stateChange()
  }, [])

  const newManager = useCallback((e: { doc?: DocJson; collab?: { version?: number } }) => {
    const { ipfsApi, ipfsGateway } = config.current || {}
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
      new TodoItem({ todoItemReadOnly: config.current?.todoItemReadOnly }),
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

    manager.current = new Manager(extensions.filter(notEmpty), e.doc)
    doc.current = manager.current.state.doc

    update()
  }, [])

  useEffect(() => {
    Message.instance.on('setState', e => {
      config.current = e.config
      collabOptions.current = e.collab

      if (!collabOptions.current) {
        newManager({ doc: e.doc })
      } else {
        collabClient.current = io(collabOptions.current.socketIoUri, {
          query: {
            accessToken: collabOptions.current.accessToken,
            userId: collabOptions.current.userId,
            paperId: collabOptions.current.paperId,
          },
        })
        collabClient.current.on('paper', ({ version, doc }) => {
          newManager({ doc, collab: { version } })
        })
        collabClient.current.on('transaction', ({ steps, clientIDs }) => {
          if (manager.current && editor.current?.editorView) {
            const { schema } = manager.current
            const { editorView } = editor.current
            const { state } = editorView
            const tr = receiveTransaction(
              state,
              steps.map(i => Step.fromJSON(schema, i)),
              clientIDs
            )
            editorView.updateState(state.apply(tr))
          }
        })
      }
    })

    Message.instance.on('getState', () => {
      doc.current && Message.instance.getState(doc.current.toJSON())
    })

    Message.instance.on('saveState', () => {
      doc.current && Message.instance.saveState(doc.current.toJSON())
    })

    Message.instance.editorReady()

    return () => {
      Message.instance.removeAllListeners()
    }
  }, [])

  useHotkey(window, ['mod', 's'], e => {
    e.preventDefault()
    doc.current && Message.instance.saveState(doc.current.toJSON())
  })

  if (!manager.current) {
    return null
  }

  return (
    <_Editor
      ref={editor}
      readOnly={config.current?.readOnly}
      autoFocus
      manager={manager.current}
      dispatchTransaction={function (tr) {
        const state = this.state.apply(tr)
        this.updateState(state)

        if (collabClient.current) {
          const sendable = sendableSteps(state)
          if (sendable) {
            collabClient.current.emit('transaction', sendable)
          }
        }

        if (tr.docChanged) {
          setDoc(state.doc)
        }
      }}
    />
  )
})

const _Editor = styled(Editor)`
  .ProseMirror {
    min-height: 100vh;
    padding: 8px;
    padding-bottom: 100px;
    max-width: 800px;
    margin: auto;
  }
`

export interface Config {
  readOnly?: boolean
  todoItemReadOnly?: boolean
  ipfsApi?: string
  ipfsGateway?: string
}

export type MessageDataSend =
  | { type: 'editorReady' }
  | { type: 'stateChange' }
  | { type: 'saveState'; doc: DocJson }
  | { type: 'getState'; doc: DocJson }

export type MessageDataRecv =
  | { type: 'getState' }
  | { type: 'saveState' }
  | {
      type: 'setState'
      doc?: DocJson
      collab?: CollabOptions
      config?: Config
    }

declare interface Message {
  on(event: 'getState', listener: () => void): this
  on(event: 'saveState', listener: () => void): this
  on(
    event: 'setState',
    listener: (state: { doc?: DocJson; collab?: CollabOptions; config?: Config }) => void
  ): this
}

class Message extends EventEmitter {
  static readonly instance = new Message()

  constructor() {
    super()
    window.addEventListener('message', this.recvMessage)
  }

  editorReady() {
    this.postMessage({ type: 'editorReady' })
  }

  stateChange() {
    this.postMessage({ type: 'stateChange' })
  }

  saveState(doc: DocJson) {
    this.postMessage({ type: 'saveState', doc })
  }

  getState(doc: DocJson) {
    this.postMessage({ type: 'getState', doc })
  }

  dispose() {
    window.removeEventListener('message', this.recvMessage)
  }

  private recvMessage = (e: MessageEvent<MessageDataRecv>) => {
    this.emit(e.data.type, e.data)
  }

  private postMessage(data: MessageDataSend) {
    const inAppWebView = (window as any).flutter_inappwebview
    if (typeof inAppWebView !== 'undefined') {
      inAppWebView.callHandler('postMessage', data)
    } else if (window.parent !== window) {
      window.parent.postMessage(data, '*')
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  const search = new URLSearchParams(window.location.search)
  const socketIoUri = search.get('socketIoUri')
  const accessToken = search.get('accessToken')
  const userId = search.get('userId')
  const paperId = search.get('paperId')

  const collab: CollabOptions | undefined =
    socketIoUri && accessToken && userId && paperId
      ? {
          socketIoUri,
          accessToken,
          userId,
          paperId,
        }
      : undefined

  const readOnly = search.get('readOnly')
  const todoItemReadOnly = search.get('todoItemReadOnly')
  const ipfsApi = search.get('ipfsApi')
  const ipfsGateway = search.get('ipfsGateway')

  const config: Config | undefined =
    readOnly || todoItemReadOnly || ipfsApi || ipfsGateway
      ? {
          readOnly: readOnly === 'true' ? true : readOnly === 'false' ? false : undefined,
          todoItemReadOnly:
            todoItemReadOnly === 'true' ? true : todoItemReadOnly === 'false' ? false : undefined,
          ipfsApi: ipfsApi || undefined,
          ipfsGateway: ipfsGateway || undefined,
        }
      : undefined

  if (collab || config) {
    setTimeout(() => {
      window.postMessage({ type: 'setState', config, collab }, '*')
    })
  }
}
