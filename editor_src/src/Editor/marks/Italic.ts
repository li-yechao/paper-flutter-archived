import { Keymap, toggleMark } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { MarkSpec, MarkType } from 'prosemirror-model'
import markInputRule from '../lib/markInputRule'
import Mark from './Mark'

export default class Italic extends Mark {
  get name() {
    return 'italic'
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [
        { tag: 'i' },
        { tag: 'em' },
        { style: 'font-style', getAttrs: value => value === 'italic' && null },
      ],
      toDOM: () => ['em'],
    }
  }

  inputRules({ type }: { type: MarkType }): InputRule[] {
    return [
      markInputRule(/(?:^|[^_])(_([^_]+)_)$/, type),
      markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, type),
    ]
  }

  keymap({ type }: { type: MarkType }): Keymap {
    return {
      'Mod-i': toggleMark(type),
      'Mod-I': toggleMark(type),
    }
  }
}
