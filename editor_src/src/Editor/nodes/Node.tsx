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
  }) => P,
  options: {
    createDom?: () => {
      dom?: Element
      reactDOM?: Element
      contentDOM?: Element
    }
    stopEvent?: (event: Event) => boolean
    ignoreMutation?: (
      p:
        | MutationRecord
        | {
            type: 'selection'
            target: Element
          }
    ) => boolean
  } = {}
): NodeViewCreator {
  return ({ node, view, getPos }) => {
    if (typeof getPos !== 'function') {
      throw new Error(`Invalid getPos ${getPos}`)
    }

    const {
      dom = document.createElement('div'),
      reactDOM = document.createElement('div'),
      contentDOM,
    } = options.createDom?.() ?? {}
    dom.append(reactDOM)
    contentDOM && dom.append(contentDOM)

    let selected = false

    const render = () => {
      ReactDOM.render(
        <StylesProvider injectFirst>
          <Component {...props({ node, view, getPos, selected })} />
        </StylesProvider>,
        reactDOM
      )
    }
    render()

    const nodeView: NodeView = {
      dom,
      contentDOM,
      update: updatedNode => {
        if (updatedNode.type !== node.type) {
          return false
        }
        node = updatedNode
        render()
        return true
      },
      stopEvent: options.stopEvent,
      ignoreMutation: options.ignoreMutation,
      destroy: () => {
        ReactDOM.unmountComponentAtNode(reactDOM)
      },
    }

    if (!contentDOM) {
      nodeView.selectNode = () => {
        if (view.editable) {
          selected = true
          render()
        }
      }
      nodeView.setSelection = nodeView.selectNode
      nodeView.deselectNode = () => {
        selected = false
        render()
      }
    }

    return nodeView
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
      <React.Suspense fallback={fallback}>
        <Component {...p} />
      </React.Suspense>
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
