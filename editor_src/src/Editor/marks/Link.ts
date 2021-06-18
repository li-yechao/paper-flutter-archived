import { InputRule } from 'prosemirror-inputrules'
import { MarkSpec, MarkType, Schema } from 'prosemirror-model'
import Mark from './Mark'

export default class Link extends Mark {
  get name() {
    return 'link'
  }

  get schema(): MarkSpec {
    return {
      attrs: { href: { default: '' } },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: dom => ({
            href: (<HTMLElement>dom).getAttribute('href'),
          }),
        },
      ],
      toDOM: node => [
        'a',
        { ...node.attrs, rel: 'noopener noreferrer nofollow', target: '__blank' },
        0,
      ],
    }
  }

  inputRules({ type, schema }: { type: MarkType; schema: Schema }): InputRule[] {
    return [
      new InputRule(/\[(.+)]\((https?:\/\/\S+)\)/, (state, match, start, end) => {
        const [okay, alt, href] = match
        const { tr } = state

        if (okay) {
          tr.replaceWith(start, end, schema.text(alt!)).addMark(
            start,
            start + alt!.length,
            type.create({ href })
          )
        }

        return tr
      }),
      new InputRule(/<(https?:\/\/\S+)>/, (state, match, start, end) => {
        const [okay, href] = match
        const { tr } = state

        if (okay) {
          tr.replaceWith(start, end, schema.text(href!)).addMark(
            start,
            start + href!.length,
            type.create({ href })
          )
        }

        return tr
      }),
    ]
  }
}
