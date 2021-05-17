import { Keymap, toggleMark } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { MarkSpec, MarkType } from 'prosemirror-model'
import markInputRule from '../lib/markInputRule'
import Mark from './Mark'

export default class Strikethrough extends Mark {
  get name() {
    return 'strikethrough'
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }],
      toDOM: () => ['del', 0],
    }
  }

  inputRules({ type }: { type: MarkType }): InputRule[] {
    return [markInputRule(/~([^~]+)~$/, type)]
  }

  keymap({ type }: { type: MarkType }): Keymap {
    return {
      'Mod-d': toggleMark(type),
    }
  }
}
