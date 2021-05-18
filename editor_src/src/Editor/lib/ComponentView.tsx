import React from 'react'
import ReactDOM from 'react-dom'
import { EditorView, NodeView } from 'prosemirror-view'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import Node from '../nodes/Node'

export interface ComponentViewProps {
  node: ProsemirrorNode
  view: EditorView
  selected: boolean
  getPos: () => number
}

export default class ComponentView implements NodeView {
  node: ProsemirrorNode
  view: EditorView
  getPos: () => number
  selected = false
  dom: HTMLElement | null

  constructor(
    private _node: Node,
    {
      node,
      view,
      getPos,
    }: {
      node: ProsemirrorNode
      view: EditorView
      getPos: () => number
    }
  ) {
    this.getPos = getPos
    this.node = node
    this.view = view
    this.dom = node.type.spec.inline
      ? document.createElement('span')
      : document.createElement('div')

    this.renderElement()
  }

  renderElement() {
    const { _node, node, view, selected, getPos } = this
    const C = _node.component!
    ReactDOM.render(<C node={node} view={view} selected={selected} getPos={getPos} />, this.dom)
  }

  update(node: ProsemirrorNode) {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node
    this.renderElement()
    return true
  }

  selectNode() {
    if (this.view.editable) {
      this.selected = true
      this.renderElement()
    }
  }

  deselectNode() {
    this.selected = false
    this.renderElement()
  }

  stopEvent() {
    return this._node.stopEvent
  }

  ignoreMutation() {
    return this._node.ignoreMutation
  }

  destroy() {
    if (this.dom) {
      ReactDOM.unmountComponentAtNode(this.dom)
    }
    this.dom = null
  }
}
