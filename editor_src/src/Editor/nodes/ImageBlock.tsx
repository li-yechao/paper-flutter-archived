import styled from '@emotion/styled'
import { NodeSpec } from 'prosemirror-model'
import React, { useEffect, useState } from 'react'
import { ComponentViewProps } from '../lib/ComponentView'
import { FigureView } from '../lib/FigureView'
import Node from './Node'

export interface ImageBlockOptions {
  upload: (file: File) => Promise<string>
  getSrc: (src: string) => Promise<string> | string
}

export default class ImageBlock extends Node {
  constructor(private options: ImageBlockOptions) {
    super()
  }

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

  _stopEvent = false
  get stopEvent(): boolean {
    return this._stopEvent
  }

  component = ({ node, view, selected, getPos }: ComponentViewProps) => {
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
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), node.type, { ...node.attrs, src }))
        } finally {
          setLoading(false)
        }
      })()
    }, [])

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      view.dispatch(
        view.state.tr.setNodeMarkup(getPos(), node.type, { ...node.attrs, caption: e.target.value })
      )
    }

    return (
      <FigureView
        selected={selected}
        readOnly={!view.editable}
        caption={node.attrs.caption}
        loading={loading}
        onCaptionChange={handleCaptionChange}
        toggleStopEvent={e => (this._stopEvent = e)}
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
