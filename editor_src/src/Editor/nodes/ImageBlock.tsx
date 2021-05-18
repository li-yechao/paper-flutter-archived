import styled from '@emotion/styled'
import { TextareaAutosize } from '@material-ui/core'
import { NodeSpec } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import React, { useEffect, useState } from 'react'
import { useUpdate } from 'react-use'
import CupertinoActivityIndicator from '../../components/CupertinoActivityIndicator'
import { ComponentViewProps } from '../lib/ComponentView'
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

  get plugins(): Plugin[] {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            paste: (view, event) => {
              const files = Array.from(event.clipboardData?.files ?? []).filter(i =>
                i.type.startsWith('image/')
              )
              if (files?.length) {
                event.preventDefault()
                view.dispatch(
                  view.state.tr.replaceWith(
                    view.state.selection.from,
                    view.state.selection.to,
                    files.map(file => {
                      const node = view.state.schema.nodes[this.name].create({
                        src: null,
                        caption: file.name,
                      })
                      node.file = file
                      return node
                    })
                  )
                )

                return true
              }
              return false
            },
            drop: (view, event) => {
              const files = Array.from(event.dataTransfer?.files ?? []).filter(i =>
                i.type.startsWith('image/')
              )
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (files?.length && pos) {
                event.preventDefault()
                view.dispatch(
                  view.state.tr.replaceWith(
                    pos.pos,
                    pos.pos,
                    files.map(file => {
                      const node = view.state.schema.nodes[this.name].create({
                        src: null,
                        caption: file.name,
                      })
                      node.file = file
                      return node
                    })
                  )
                )
                return true
              }
              return false
            },
          },
        },
      }),
    ]
  }

  _stopEvent = false
  get stopEvent(): boolean {
    return this._stopEvent
  }

  component = ({ node, view, selected, getPos }: ComponentViewProps) => {
    const [src, setSrc] = useState<string | null>()
    const [uploading, setUploading] = useState(false)
    const update = useUpdate()

    // Fix TextAreaAutoSize not visible.
    useEffect(() => {
      setTimeout(update)
    }, [])

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
        setUploading(true)
        try {
          const src = await this.options.upload(file)
          setSrc(await this.options.getSrc(src))
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), node.type, { ...node.attrs, src }))
        } finally {
          setUploading(false)
        }
      })()
    }, [])

    const focusCaption = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation()
      this._stopEvent = true
    }

    const blurCaption = () => (this._stopEvent = false)

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      view.dispatch(
        view.state.tr.setNodeMarkup(getPos(), node.type, { ...node.attrs, caption: e.target.value })
      )
    }

    return (
      <Figure selected={selected} onMouseDown={blurCaption} onTouchStart={blurCaption}>
        <_FigureContent>
          {uploading && (
            <_Loading>
              <_CupertinoActivityIndicator />
            </_Loading>
          )}

          <_ImageWrapper>
            <img src={src || undefined} />
          </_ImageWrapper>
        </_FigureContent>
        <figcaption>
          {view.editable ? (
            <CaptionInput
              value={node.attrs.caption}
              onFocus={blurCaption}
              onBlurCapture={blurCaption}
              onMouseUp={focusCaption}
              onTouchEnd={focusCaption}
              onChange={handleCaptionChange}
            />
          ) : (
            node.attrs.caption
          )}
        </figcaption>
      </Figure>
    )
  }
}

const _Loading = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(128, 128, 128, 0.5);
`

const _CupertinoActivityIndicator = styled(CupertinoActivityIndicator)`
  width: 56px;
  height: 56px;
  color: currentColor;
`

const Figure = styled.figure<{ selected: boolean }>`
  outline: 0px solid currentColor;
  outline-style: dotted;
  outline-width: ${props => (props.selected ? '1px' : 0)};
  margin: 10px 0;

  > figcaption {
    display: block;
    position: relative;
    text-align: center;
    margin-top: 8px;
  }
`

const _FigureContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const _ImageWrapper = styled.div`
  position: relative;
  display: inline-block;

  > img {
    vertical-align: middle;
    object-fit: contain;
    max-width: 100%;
  }
`

const CaptionInput = styled(TextareaAutosize)`
  display: block;
  border: none;
  outline: none;
  background-color: transparent;
  width: 100%;
  min-width: 0;
  text-align: center;
  color: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  resize: none;
  padding: 0;
  margin: 0;
`
