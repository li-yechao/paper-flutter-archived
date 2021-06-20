import styled from '@emotion/styled'
import { StylesProvider } from '@material-ui/core'
import { Keymap } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { NodeSpec, Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model'
import { EditorView, NodeView } from 'prosemirror-view'
import React from 'react'
import ReactDOM from 'react-dom'
import CupertinoActivityIndicator from '../../components/CupertinoActivityIndicator'
import Extension, { ExtensionType } from '../lib/Extension'

export type NodeViewCreator = (args: {
  node: ProsemirrorNode
  view: EditorView
  getPos: (() => number) | boolean
}) => NodeView

export default abstract class Node extends Extension {
  get type(): ExtensionType {
    return 'node'
  }

  abstract get schema(): NodeSpec

  inputRules<S extends Schema<any, any>>(_options: { type: NodeType<S> }): InputRule<S>[] {
    return []
  }

  keymap<S extends Schema<any, any>>(_options: { type: NodeType<S> }): Keymap<S> {
    return {}
  }

  get nodeView(): NodeViewCreator | undefined {
    return undefined
  }
}

export function createReactNodeViewCreator<P>(
  Component: React.ComponentType<P>,
  props: (args: {
    node: ProsemirrorNode
    view: EditorView
    getPos: () => number
    selected: boolean
  }) => P
): NodeViewCreator {
  return ({ node, view, getPos }) => {
    if (typeof getPos !== 'function') {
      throw new Error(`Invalid getPos ${getPos}`)
    }

    let selected = false

    const dom = document.createElement('div')

    const render = () => {
      ReactDOM.render(<Component {...props({ node, view, getPos, selected })} />, dom)
    }
    render()

    const selectNode = () => {
      if (view.editable) {
        selected = true
        render()
      }
    }

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
      setSelection: selectNode,
      selectNode,
      deselectNode: () => {
        selected = false
        render()
      },
      stopEvent: () => true,
      ignoreMutation: () => true,
      destroy: () => {
        ReactDOM.unmountComponentAtNode(dom)
      },
    }
  }
}

export function lazyReactNodeView<P>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback: React.ReactNode = (
    <_FallbackContainer>
      <CupertinoActivityIndicator />
    </_FallbackContainer>
  )
): React.ComponentType<P> {
  return (p: P) => {
    return (
      <StylesProvider injectFirst>
        <React.Suspense fallback={fallback}>
          <Component {...p} />
        </React.Suspense>
      </StylesProvider>
    )
  }
}

const _FallbackContainer = styled.div`
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`
