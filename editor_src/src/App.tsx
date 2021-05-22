import { hot } from 'react-hot-loader/root'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Node } from 'prosemirror-model'
import styled from '@emotion/styled'
import { useHotkey } from '@react-hook/hotkey'
import { useUpdate } from 'react-use'
import Editor from './Editor'
import { documentToProsemirrorDoc, prosemirrorDocToDocument } from './doc'
import { ImageBlockOptions } from './Editor/nodes/ImageBlock'

export type MessageEventData =
  | { type: 'getState' }
  | { type: 'saveState' }
  | {
      type: 'setState'
      data: {
        title?: string
        content?: string
        config?: Config
      }
    }

export interface Config {
  readOnly?: boolean
  todoItemReadOnly?: boolean
  ipfsApi?: string
  ipfsGateway?: string
}

const postMessage = (data: any) => {
  const inAppWebView = (window as any).flutter_inappwebview
  if (typeof inAppWebView !== 'undefined') {
    inAppWebView.callHandler('postMessage', data)
  } else if (window.parent !== window) {
    window.parent.postMessage(data, '*')
  }
}

export const App = hot(() => {
  const editorKey = useRef(0)
  const editor = useRef<Editor>(null)
  const doc = useRef<Node>()
  const config = useRef<Config>({})
  const update = useUpdate()

  const getState = useCallback(() => {
    if (!doc.current) {
      return
    }
    const { title, content } = prosemirrorDocToDocument(doc.current)
    return {
      title,
      content: JSON.stringify(content),
    }
  }, [])

  const setDoc = useCallback((e: { readonly target: { readonly value: Node<any> } }) => {
    doc.current = e.target.value
    update()
    postMessage({ type: 'stateChange' })
  }, [])

  useEffect(() => {
    const listener = ({ data }: MessageEvent<MessageEventData>) => {
      if (data.type === 'setState') {
        // First: Update the editor config.
        if (typeof data.data.config?.readOnly === 'boolean') {
          config.current.readOnly = data.data.config.readOnly
        }
        if (typeof data.data.config?.todoItemReadOnly === 'boolean') {
          config.current.todoItemReadOnly = data.data.config.todoItemReadOnly
        }
        if (typeof data.data.config?.ipfsApi === 'string') {
          config.current.ipfsApi = data.data.config.ipfsApi
        }
        if (typeof data.data.config?.ipfsGateway === 'string') {
          config.current.ipfsGateway = data.data.config.ipfsGateway
        }

        editorKey.current += 1
        update()

        // Second: Update the value.
        setTimeout(() => {
          const content = JSON.parse(stringOr(data.data.content, null) || '[]')
          if (editor.current) {
            doc.current = Node.fromJSON(
              editor.current.schema,
              documentToProsemirrorDoc({
                title: stringOr(data.data.title, ''),
                content,
              })
            )
          }

          update()
        })
      } else if (data.type === 'getState') {
        const data = getState()
        data && postMessage({ type: 'getState', data: getState() })
      } else if (data.type === 'saveState') {
        const data = getState()
        data && postMessage({ type: 'saveState', data })
      }
    }

    window.addEventListener('message', listener)
    postMessage({ type: 'editorReady' })

    return () => {
      window.removeEventListener('message', listener)
    }
  }, [])

  useHotkey(window, ['mod', 's'], e => {
    e.preventDefault()
    const data = getState()
    data && postMessage({ type: 'saveState', data })
  })

  const readOnly = config.current.readOnly ?? true
  const todoItemReadOnly = config.current.todoItemReadOnly ?? true

  const imageBlockOptions = useMemo<ImageBlockOptions | undefined>(() => {
    const { ipfsApi, ipfsGateway } = config.current
    if (!ipfsApi || !ipfsGateway) {
      return
    }
    return {
      upload: async file => {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${ipfsApi}/api/v0/add`, {
          method: 'POST',
          body: form,
        })
        const json = await res.json()
        return json.Hash
      },
      getSrc: hash => {
        return `${ipfsGateway}/ipfs/${hash}`
      },
    }
  }, [config.current.ipfsApi, config.current.ipfsGateway])

  return (
    <_Editor
      key={editorKey.current}
      readOnly={readOnly}
      autoFocus
      todoItemReadOnly={todoItemReadOnly}
      ref={editor}
      value={doc.current}
      onChange={setDoc}
      imageBlockOptions={imageBlockOptions}
      videoBlockOptions={imageBlockOptions}
    />
  )
})

function stringOr<T>(v: any, d: T) {
  return typeof v === 'string' ? v : d
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
