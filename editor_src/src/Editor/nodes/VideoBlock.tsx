import styled from '@emotion/styled'
import { createFFmpeg } from '@ffmpeg/ffmpeg'
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded'
import PauseRoundedIcon from '@material-ui/icons/PauseRounded'
import { NodeSpec } from 'prosemirror-model'
import React, { useEffect, useRef, useState } from 'react'
import { useToggle } from 'react-use'
import { ComponentViewProps } from '../lib/ComponentView'
import Node from './Node'
import { FigureView } from '../lib/FigureView'

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
    const [playing, togglePlaying] = useToggle(true)
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
      let file = (node as any).file as File
      if (!file) {
        return
      }
      ;(async () => {
        setLoading(true)

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
          setLoading(false)
        }
      })()
    }, [])

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
      <FigureView
        selected={selected}
        readOnly={!view.editable}
        caption={node.attrs.caption}
        loading={loading}
        onCaptionChange={handleCaptionChange}
        toggleStopEvent={e => (this._stopEvent = e)}
      >
        <_Content>
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
        </_Content>
      </FigureView>
    )
  }
}

const _Content = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;

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
