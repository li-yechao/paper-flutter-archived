import styled from '@emotion/styled'
import { TextareaAutosize } from '@material-ui/core'
import React, { ReactNode, useCallback, useEffect } from 'react'
import { useUpdate } from 'react-use'
import CupertinoActivityIndicator from '../../components/CupertinoActivityIndicator'

export interface FigureViewProps {
  children?: ReactNode
  className?: string
  readOnly?: boolean
  selected?: boolean
  caption?: string
  loading?: boolean
  onCaptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  toggleStopEvent?: (stopEvent: boolean) => void
}

export const FigureView = ({
  children,
  className,
  readOnly,
  selected,
  caption,
  loading,
  onCaptionChange,
  toggleStopEvent,
}: FigureViewProps) => {
  const update = useUpdate()

  // Fix TextAreaAutoSize not visible.
  useEffect(() => {
    setTimeout(update)
  }, [])

  const focusCaption = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation()
      toggleStopEvent?.(true)
    },
    [toggleStopEvent]
  )

  const blurCaption = useCallback(() => {
    toggleStopEvent?.(false)
  }, [toggleStopEvent])

  return (
    <_Figure
      className={className}
      selected={selected}
      onMouseDown={blurCaption}
      onTouchStart={blurCaption}
    >
      <_FigureContent>
        {loading && (
          <_Loading>
            <_CupertinoActivityIndicator />
          </_Loading>
        )}
        {children}
      </_FigureContent>
      <figcaption>
        {readOnly ? (
          caption
        ) : (
          <_CaptionInput
            value={caption}
            onFocus={blurCaption}
            onBlurCapture={blurCaption}
            onMouseUp={focusCaption}
            onTouchEnd={focusCaption}
            onChange={onCaptionChange}
          />
        )}
      </figcaption>
    </_Figure>
  )
}

const _Figure = styled.figure<{ selected?: boolean }>`
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

const _CaptionInput = styled(TextareaAutosize)`
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
