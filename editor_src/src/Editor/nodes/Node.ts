import { Keymap } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { NodeSpec, NodeType, Schema } from 'prosemirror-model'
import { ComponentViewProps } from '../lib/ComponentView'
import Extension, { ExtensionType } from '../lib/Extension'

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

  component?: React.ComponentType<ComponentViewProps>

  get stopEvent(): boolean {
    return true
  }

  get ignoreMutation(): boolean {
    return true
  }
}
