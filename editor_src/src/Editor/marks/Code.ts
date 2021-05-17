import { Keymap, toggleMark } from 'prosemirror-commands'
import { InputRule } from 'prosemirror-inputrules'
import { MarkSpec, MarkType } from 'prosemirror-model'
import markInputRule from '../lib/markInputRule'
import Mark from './Mark'

export default class Code extends Mark {
  get name() {
    return 'code'
  }

  get schema(): MarkSpec {
    return {
      parseDOM: [{ tag: 'code' }],
      toDOM: () => ['code'],
    }
  }

  inputRules({ type }: { type: MarkType }): InputRule[] {
    return [markInputRule(/(?:^|[^`])(`([^`]+)`)$/, type)]
  }

  keymap({ type }: { type: MarkType }): Keymap {
    // Note: This key binding only works on non-Mac platforms
    // https://github.com/ProseMirror/prosemirror/issues/515
    return {
      'Mod`': toggleMark(type),
    }
  }
}
