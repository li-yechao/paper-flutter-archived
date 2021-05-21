import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import Extension from '../lib/Extension'

export default class Placeholder extends Extension {
  get name(): string {
    return 'placeholder'
  }

  get plugins(): Plugin[] {
    return [
      new Plugin({
        props: {
          decorations: state => {
            const decorations: Decoration[] = []
            let isBodyEmpty = true
            let bodyPlaceholderPos = -1

            state.doc.forEach((node, offset) => {
              if (node.type.name === 'title') {
                if (node.textContent.trim().length === 0) {
                  const placeholder = document.createElement('span')
                  placeholder.setAttribute('data-placeholder', 'Untitled')
                  placeholder.classList.add('ProseMirror-placeholder')
                  decorations.push(Decoration.widget(offset + 1, placeholder))
                }
              } else {
                if (bodyPlaceholderPos === -1) {
                  bodyPlaceholderPos = offset + 1
                }

                if (!node.isTextblock || node.textContent.trim().length > 0) {
                  isBodyEmpty = false
                }
              }
            })

            if (isBodyEmpty && bodyPlaceholderPos >= 0) {
              const placeholder = document.createElement('span')
              placeholder.setAttribute('data-placeholder', 'Write something...')
              placeholder.classList.add('ProseMirror-placeholder')
              decorations.push(Decoration.widget(bodyPlaceholderPos, placeholder))
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  }
}
