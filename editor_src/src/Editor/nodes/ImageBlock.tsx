import styled from '@emotion/styled'
import { Node as ProsemirrorNode, NodeSpec } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { FigureView } from '../lib/FigureView'
import Node, { NodeViewCreator } from './Node'

export interface ImageBlockOptions {
  upload: (file: File) => Promise<string>
  getSrc: (src: string) => Promise<string> | string
}

export default class ImageBlock extends Node {
  constructor(private options: ImageBlockOptions) {
    super()
  }

  private stopEvent = false

  get name(): string {
    return 'image_block'
  }

  get schema(): NodeSpec {
    return {
      attrs: { src: { default: null }, caption: { default: null } },
      group: 'block',
      defining: true,
      isolating: true,
      atom: true,
      draggable: true,
      parseDOM: [
        {
          tag: 'figure[data-type="image_block"]',
          getAttrs: dom => {
            const img = (dom as HTMLElement).getElementsByTagName('img')[0]
            const caption = (dom as HTMLElement).getElementsByTagName('figcaption')[0]
            return {
              src: img?.getAttribute('data-src'),
              caption: caption?.textContent,
            }
          },
        },
      ],
      toDOM: node => {
        return [
          'figure',
          { 'data-type': 'image_block' },
          ['img', { 'data-src': node.attrs.src, title: node.attrs.caption }],
          ['figcaption', node.attrs.caption],
        ]
      },
    }
  }

  get nodeView(): NodeViewCreator {
    return ({ node, view, getPos }) => {
      const dom = document.createElement('div')
      let selected = false
      const render = () => {
        const C = this.component
        ReactDOM.render(<C node={node} view={view} selected={selected} getPos={getPos} />, dom)
      }
      render()

      return {
        dom,
        update: updatedNode => {
          if (updatedNode.type !== node.type) {
            return false
          }
          node = updatedNode
          render()
          return true
        },
        selectNode: () => {
          if (view.editable) {
            selected = true
            render()
          }
        },
        deselectNode: () => {
          selected = false
          render()
        },
        stopEvent: () => this.stopEvent,
        ignoreMutation: () => true,
        destroy: () => {
          ReactDOM.unmountComponentAtNode(dom)
        },
      }
    }
  }

  component = ({
    node,
    view,
    selected,
    getPos,
  }: {
    node: ProsemirrorNode
    view: EditorView
    selected: boolean
    getPos: boolean | (() => number)
  }) => {
    const [src, setSrc] = useState<string | null>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      ;(async () => {
        if (node.attrs.src) {
          setSrc(await this.options.getSrc(node.attrs.src))
        }
      })()
    }, [node.attrs.src])

    useEffect(() => {
      const file = (node as any).file as File
      if (!file) {
        return
      }
      setSrc(URL.createObjectURL(file))
      ;(async () => {
        setLoading(true)
        try {
          const src = await this.options.upload(file)
          setSrc(await this.options.getSrc(src))
          if (typeof getPos === 'function') {
            view.dispatch(view.state.tr.setNodeMarkup(getPos(), node.type, { ...node.attrs, src }))
          }
        } finally {
          setLoading(false)
        }
      })()
    }, [])

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (typeof getPos === 'function') {
        view.dispatch(
          view.state.tr.setNodeMarkup(getPos(), node.type, {
            ...node.attrs,
            caption: e.target.value,
          })
        )
      }
    }

    return (
      <FigureView
        selected={selected}
        readOnly={!view.editable}
        caption={node.attrs.caption}
        loading={loading}
        onCaptionChange={handleCaptionChange}
        toggleStopEvent={e => (this.stopEvent = e)}
      >
        <_Content>
          <img src={src || undefined} />
        </_Content>
      </FigureView>
    )
  }
}

const _Content = styled.div`
  position: relative;
  display: inline-block;

  > img {
    vertical-align: middle;
    object-fit: contain;
    max-width: 100%;
  }
`
