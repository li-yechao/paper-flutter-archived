import { hot } from 'react-hot-loader/root'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Node } from 'prosemirror-model'
import styled from '@emotion/styled'
import { Box, TextareaAutosize } from '@material-ui/core'
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
  } else {
    window.parent.postMessage(data, '*')
  }
}

export const App = hot(() => {
  const editorKey = useRef(0)
  const editor = useRef<Editor>(null)
  const doc = useRef<Node>()
  const title = useRef<string>()
  const config = useRef<Config>({})
  const update = useUpdate()

  const getState = useCallback(() => {
    return {
      title: title.current,
      content: doc.current && JSON.stringify(prosemirrorDocToDocument(doc.current).content),
    }
  }, [])

  const setTitle = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    title.current = e.target.value
    update()
    postMessage({ type: 'stateChange' })
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
          title.current = stringOr(data.data.title, '')
          const content = JSON.parse(stringOr(data.data.content, null) || '[]')
          doc.current = Node.fromJSON(editor.current!.schema, documentToProsemirrorDoc({ content }))

          update()
        })
      } else if (data.type === 'getState') {
        postMessage({
          type: 'getState',
          data: getState(),
        })
      } else if (data.type === 'saveState') {
        postMessage({
          type: 'saveState',
          data: getState(),
        })
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
    postMessage({
      type: 'saveState',
      data: getState(),
    })
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
    <>
      <Box pt={2}>
        <Box px={2}>
          <_TitleInput
            readOnly={readOnly}
            autoFocus
            placeholder="Untitled"
            maxLength={100}
            value={title.current}
            onChange={setTitle}
          />
        </Box>

        <Box px={2}>
          <_Editor
            key={editorKey.current}
            readOnly={readOnly}
            todoItemReadOnly={todoItemReadOnly}
            ref={editor}
            value={doc.current}
            onChange={setDoc}
            imageBlockOptions={imageBlockOptions}
            videoBlockOptions={imageBlockOptions}
          />
        </Box>
      </Box>
    </>
  )
})

function stringOr<T>(v: any, d: T) {
  return typeof v === 'string' ? v : d
}

const _TitleInput = styled(TextareaAutosize)`
  font-family: 'Chinese Quote', 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji';
  border: none;
  outline: none;
  resize: none;
  line-height: 1.389;
  width: 100%;
  min-height: 32px;
  font-weight: 700;
  font-size: 36px;
  background-color: transparent;
  color: inherit;
  padding-left: 0;
  padding-right: 0;
`

const _Editor = styled(Editor)`
  .ProseMirror {
    min-height: 60vh;
    padding-bottom: 200px;
  }
`
