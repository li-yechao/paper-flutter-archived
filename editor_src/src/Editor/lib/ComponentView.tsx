import React from 'react'
import ReactDOM from 'react-dom'
import { EditorView, NodeView } from 'prosemirror-view'
import { Node } from 'prosemirror-model'

export interface ComponentViewProps {
  node: Node
  view: EditorView
  selected: number
  getPos: () => number
}

export default class ComponentView implements NodeView {
  component: React.ComponentType<ComponentViewProps>
  node: Node
  view: EditorView
  getPos: () => number
  selected = 0
  dom: HTMLElement | null

  constructor(
    component: React.ComponentType<ComponentViewProps>,
    { node, view, getPos }: { node: Node; view: EditorView; getPos: () => number }
  ) {
    this.component = component
    this.getPos = getPos
    this.node = node
    this.view = view
    this.dom = node.type.spec.inline
      ? document.createElement('span')
      : document.createElement('div')

    this.renderElement()
  }

  renderElement() {
    const { component: Component, node, view, selected, getPos } = this
    ReactDOM.render(
      <Component node={node} view={view} selected={selected} getPos={getPos} />,
      this.dom
    )
  }

  update(node: Node) {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node
    this.renderElement()
    return true
  }

  selectNode() {
    if (this.view.editable) {
      this.selected += 1
      this.renderElement()
    }
  }

  setSelection() {
    this.selectNode()
  }

  stopEvent() {
    return true
  }

  ignoreMutation() {
    return true
  }

  destroy() {
    if (this.dom) {
      ReactDOM.unmountComponentAtNode(this.dom)
    }
    this.dom = null
  }
}
