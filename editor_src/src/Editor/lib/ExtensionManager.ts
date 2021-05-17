import { InputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { MarkSpec, NodeSpec, Schema, Node as ProsemirrorNode } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, EditorView, NodeView } from 'prosemirror-view'
import Mark from '../marks/Mark'
import Node from '../nodes/Node'
import ComponentView from './ComponentView'
import Extension from './Extension'

export default class ExtensionManager {
  extensions: Extension[]

  constructor(extensions: Extension[] = []) {
    this.extensions = extensions
  }

  get nodes(): Node[] {
    return <Node[]>this.extensions.filter(i => i.type === 'node')
  }

  get nodeSpecs(): { [key: string]: NodeSpec } {
    return this.nodes.reduce((res, i) => ({ ...res, [i.name]: i.schema }), {})
  }

  get marks(): Mark[] {
    return <Mark[]>this.extensions.filter(i => i.type === 'mark')
  }

  get markSpecs(): { [key: string]: MarkSpec } {
    return this.marks.reduce((res, i) => ({ ...res, [i.name]: i.schema }), {})
  }

  get plugins(): Plugin[] {
    return this.extensions.reduce((res, i) => res.concat(i.plugins), [] as Plugin[])
  }

  inputRules<S extends Schema<any, any>>({ schema }: { schema: S }): InputRule<S>[] {
    return this.nodes
      .flatMap(i => i.inputRules({ type: schema.nodes[i.name]! }))
      .concat(this.marks.flatMap(i => i.inputRules({ type: schema.marks[i.name]!, schema })))
  }

  keymap<S extends Schema<any, any>>({ schema }: { schema: S }): Plugin[] {
    return this.nodes
      .map(i => keymap(i.keymap({ type: schema.nodes[i.name]! })))
      .concat(this.marks.map(i => keymap(i.keymap({ type: schema.marks[i.name]! }))))
  }

  nodeViews<S extends Schema<any, any>>() {
    return this.nodes.reduce(
      (res, i) => {
        const { component } = i
        if (component) {
          res[i.name] = (node, view, getPos) =>
            new ComponentView(component, {
              node,
              view,
              getPos: getPos as any,
            })
        }
        return res
      },
      <
        {
          [name: string]: (
            node: ProsemirrorNode<S>,
            view: EditorView<S>,
            getPos: (() => number) | boolean,
            decorations: Decoration[]
          ) => NodeView<S>
        }
      >{}
    )
  }
}
