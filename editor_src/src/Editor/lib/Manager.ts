import { InputRule, inputRules } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { MarkSpec, NodeSpec, Schema, Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorState, Plugin } from 'prosemirror-state'
import { Decoration, EditorView, NodeView } from 'prosemirror-view'
import Mark from '../marks/Mark'
import Node from '../nodes/Node'
import Extension from './Extension'

export default class Manager {
  constructor(private extensions: Extension[] = [], private doc?: { [key: string]: any }) {
    this.schema = new Schema({
      nodes: this.nodeSpecs,
      marks: this.markSpecs,
    })
  }

  readonly schema: Schema

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

  get inputRules(): InputRule[] {
    return this.nodes
      .flatMap(i => i.inputRules({ type: this.schema.nodes[i.name]! }))
      .concat(
        this.marks.flatMap(i =>
          i.inputRules({ type: this.schema.marks[i.name]!, schema: this.schema })
        )
      )
  }

  get keymap(): Plugin[] {
    return this.nodes
      .map(i => keymap(i.keymap({ type: this.schema.nodes[i.name]! })))
      .concat(this.marks.map(i => keymap(i.keymap({ type: this.schema.marks[i.name]! }))))
  }

  get nodeViews() {
    return this.nodes.reduce(
      (res, i) => {
        const { nodeView } = i
        if (nodeView) {
          res[i.name] = (node, view, getPos) => nodeView({ node, view, getPos })
        }
        return res
      },
      <
        {
          [name: string]: (
            node: ProsemirrorNode,
            view: EditorView,
            getPos: (() => number) | boolean,
            decorations: Decoration[]
          ) => NodeView
        }
      >{}
    )
  }

  createState() {
    return EditorState.create({
      schema: this.schema,
      doc: this.doc && ProsemirrorNode.fromJSON(this.schema, this.doc),
      plugins: [inputRules({ rules: this.inputRules }), ...this.keymap, ...this.plugins],
    })
  }
}
