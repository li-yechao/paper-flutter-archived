import styled from '@emotion/styled'
import { createFFmpeg } from '@ffmpeg/ffmpeg'
import { TextareaAutosize } from '@material-ui/core'
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded'
import PauseRoundedIcon from '@material-ui/icons/PauseRounded'
import { NodeSpec } from 'prosemirror-model'
import React, { useEffect, useRef, useState } from 'react'
import { useToggle, useUpdate } from 'react-use'
import CupertinoActivityIndicator from '../../components/CupertinoActivityIndicator'
import { ComponentViewProps } from '../lib/ComponentView'
import Node from './Node'

export interface VideoBlockOptions {
  upload: (file: File) => Promise<string>
  getSrc: (src: string) => Promise<string> | string
}

export default class VideoBlock extends Node {
  constructor(private options: VideoBlockOptions) {
    super()
  }

  get name(): string {
    return 'video_block'
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
          tag: 'figure[data-type="video_block"]',
          getAttrs: dom => {
            const video = (dom as HTMLElement).getElementsByTagName('video')[0]
            const caption = (dom as HTMLElement).getElementsByTagName('figcaption')[0]
            return {
              src: video?.getAttribute('data-src'),
              caption: caption?.textContent,
            }
          },
        },
      ],
      toDOM: node => {
        return [
          'figure',
          { 'data-type': 'video_block' },
          ['video', { 'data-src': node.attrs.src, title: node.attrs.caption }],
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
    const player = useRef<HTMLVideoElement>(null)
    const [playing, togglePlaying] = useToggle(false)
    const [src, setSrc] = useState<string | null>()
    const [uploading, setUploading] = useState(false)
    const update = useUpdate()

    // Fix TextAreaAutoSize not visible.
    useEffect(() => {
      setTimeout(() => {
        update()
        togglePlaying(true)
      })
    }, [])

    useEffect(() => {
      ;(async () => {
        if (node.attrs.src) {
          setSrc(await this.options.getSrc(node.attrs.src))
        }
      })()
    }, [node.attrs.src])

    useEffect(() => {
      let file = (node as any).file as File
      if (!file) {
        return
      }
      ;(async () => {
        setUploading(true)

        if (file.type !== 'video/mp4') {
          const ffmpeg = createFFmpeg({
            corePath: './static/ffmpeg-core/ffmpeg-core.js',
          })
          await ffmpeg.load()
          const buffer = await file.arrayBuffer()
          ffmpeg.FS('writeFile', file.name, new Uint8Array(buffer, 0, buffer.byteLength))
          await ffmpeg.run('-i', file.name, 'output.mp4')
          const output = await ffmpeg.FS('readFile', 'output.mp4')
          file = new File([new Blob([output.buffer], { type: 'video/mp4' })], `${file.name}.mp4`)
        }

        setSrc(URL.createObjectURL(file))
        try {
          const src = await this.options.upload(file)
          setSrc(await this.options.getSrc(src))
          view.dispatch(
            view.state.tr.setNodeMarkup(getPos(), node.type, {
              ...node.attrs,
              src,
              caption: file.name,
            })
          )
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

    const playPause = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (playing) {
        player.current?.pause()
      } else {
        player.current?.play()
      }
      togglePlaying()
    }

    return (
      <_Figure selected={selected} onMouseDown={blurCaption} onTouchStart={blurCaption}>
        <_FigureContent>
          {uploading && (
            <_Loading>
              <_CupertinoActivityIndicator />
            </_Loading>
          )}

          <_VideoWrapper>
            <video
              ref={player}
              muted
              autoPlay={playing}
              playsInline
              src={src || undefined}
              onEnded={() => togglePlaying(false)}
              onPause={() => togglePlaying(false)}
              onPlay={() => togglePlaying(true)}
            />
            <_PlayButton onMouseUp={playPause} onTouchEnd={playPause}>
              {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
            </_PlayButton>
          </_VideoWrapper>
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
      </_Figure>
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

const _Figure = styled.figure<{ selected: boolean }>`
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

const _VideoWrapper = styled.div`
  position: relative;
  display: inline-block;

  > video {
    vertical-align: middle;
    object-fit: contain;
    max-width: 100%;
  }
`

const _PlayButton = styled.button`
  position: absolute;
  left: 8px;
  top: 8px;
  background-color: transparent;
  border: 1px solid currentColor;
  outline: none;
  border-radius: 4px;
  color: currentColor;
  opacity: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`

const CaptionInput = styled(TextareaAutosize)`
  display: block;
  border: none;
  outline: none;
  background-color: transparent;
  width: 100%;
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
