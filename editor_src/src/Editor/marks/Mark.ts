import { Keymap } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { MarkSpec, MarkType, Schema } from 'prosemirror-model'
import Extension, { ExtensionType } from '../lib/Extension'

export default abstract class Mark extends Extension {
  get type(): ExtensionType {
    return 'mark'
  }

  abstract get schema(): MarkSpec

  inputRules<S extends Schema<any, any>>(_options: {
    type: MarkType<S>
    schema: S
  }): InputRule<S>[] {
    return []
  }

  keymap<S extends Schema<any, any>>(_options: { type: MarkType<S> }): Keymap<S> {
    return {}
  }
}
