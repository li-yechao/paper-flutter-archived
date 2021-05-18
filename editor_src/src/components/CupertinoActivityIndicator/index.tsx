import styled from '@emotion/styled'
import React from 'react'

const CupertinoActivityIndicator = ({ className }: { className?: string }) => {
  return (
    <_Container className={className}>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </_Container>
  )
}

const _Container = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  display: block;
  margin: auto;
  padding: 10px;
  border-radius: 10px;

  > div {
    width: 4%;
    height: 16%;
    background: currentColor;
    position: absolute;
    left: 48%;
    top: 42%;
    opacity: 0;
    border-radius: 50px;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
    animation: fade 1s linear infinite;

    @keyframes fade {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.25;
      }
    }

    &:nth-of-type(1) {
      transform: rotate(0deg) translate(0, -104%);
      animation-delay: 0s;
    }

    &:nth-of-type(2) {
      transform: rotate(45deg) translate(0, -104%);
      animation-delay: -0.875s;
    }

    &:nth-of-type(3) {
      transform: rotate(90deg) translate(0, -104%);
      animation-delay: -0.75s;
    }

    &:nth-of-type(4) {
      transform: rotate(135deg) translate(0, -104%);
      animation-delay: -0.625s;
    }

    &:nth-of-type(5) {
      transform: rotate(180deg) translate(0, -104%);
      animation-delay: -0.5s;
    }

    &:nth-of-type(6) {
      transform: rotate(225deg) translate(0, -104%);
      animation-delay: -0.375s;
    }

    &:nth-of-type(7) {
      transform: rotate(270deg) translate(0, -104%);
      animation-delay: -0.25s;
    }

    &:nth-of-type(8) {
      transform: rotate(315deg) translate(0, -104%);
      animation-delay: -0.125s;
    }
  }
`

export default CupertinoActivityIndicator
