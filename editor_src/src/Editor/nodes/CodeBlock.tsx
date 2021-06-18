import styled from '@emotion/styled'
import { InputRule, textblockTypeInputRule } from 'prosemirror-inputrules'
import { Node as ProsemirrorNode, NodeSpec, NodeType, Slice } from 'prosemirror-model'
import { Plugin, Transaction } from 'prosemirror-state'
import { ReplaceStep } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import React, { useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useUpdate } from 'react-use'
import { v4 } from 'uuid'
import Node, { NodeViewCreator } from './Node'

type Monaco = typeof import('monaco-editor').editor
type ICodeEditor = import('monaco-editor').editor.ICodeEditor
type EditorContentManager = import('@convergencelabs/monaco-collab-ext').EditorContentManager

export default class CodeBlock extends Node {
  constructor(public options: { clientID?: string | number } = {}) {
    super()
  }

  get name(): string {
    return 'code_block'
  }

  get schema(): NodeSpec {
    return {
      attrs: { editorId: { default: null }, language: { default: null } },
      content: 'text*',
      group: 'block',
      code: true,
      defining: true,
      isolating: true,
      atom: true,
      parseDOM: [
        {
          tag: 'pre',
          preserveWhitespace: 'full',
          getAttrs: node => ({
            language: (node as HTMLElement).getAttribute('data-language') || null,
          }),
        },
      ],
      toDOM: node => {
        return [
          'pre',
          node.attrs.language ? { 'data-language': node.attrs.language } : {},
          ['code', 0],
        ]
      },
    }
  }

  private isCodeBlock(doc: ProsemirrorNode, from: number, to: number) {
    let res: { node: ProsemirrorNode; pos: number } | undefined
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === this.name) {
        if (from > pos && to < pos + node.nodeSize) {
          res = { node, pos }
        }
        return false
      }
      return
    })
    return res
  }

  private monacoEditorInstances = new Map<string, { contentManager: EditorContentManager }>()

  get plugins(): Plugin[] {
    return [
      new Plugin({
        appendTransaction: (trs, prevState, nextState) => {
          // Ensure every CodeBlock node have a editorId attribute
          {
            let tr: Transaction | undefined
            nextState.doc.descendants((node, pos) => {
              if (node.type.name === this.name && !node.attrs.editorId) {
                if (!tr) {
                  tr = nextState.tr
                }
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, editorId: v4() })
                return false
              }
              return true
            })
            if (tr) {
              return tr
            }
          }

          for (const tr of trs) {
            for (const step of tr.steps) {
              if (step instanceof ReplaceStep) {
                const from: number = (step as any).from
                const to: number = (step as any).to
                const codeBlock = this.isCodeBlock(prevState.doc, from, to)
                if (codeBlock) {
                  const slice: Slice = (step as any).slice
                  const { firstChild } = slice.content

                  if (
                    slice.content.childCount === 0 ||
                    (slice.content.childCount === 1 && firstChild?.isText)
                  ) {
                    const contentManager = this.monacoEditorInstances.get(
                      codeBlock.node.attrs.editorId
                    )?.contentManager

                    if (contentManager) {
                      const codePos = codeBlock.pos + 1
                      const index = from - codePos
                      const length = Math.abs(to - codePos - index)
                      if (firstChild?.text) {
                        if (length === 0) {
                          contentManager.insert(index, firstChild.text)
                        } else {
                          contentManager.replace(index, length, firstChild.text)
                        }
                      } else if (length > 0) {
                        contentManager.delete(index, length)
                      }
                    }
                  }
                }
              }
            }
          }

          return
        },
      }),
    ]
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [
      textblockTypeInputRule(/^```([a-z]+)?\s$/, type, match => ({
        language: match[1],
      })),
    ]
  }

  get nodeView(): NodeViewCreator {
    return ({ node, view, getPos }) => {
      if (typeof getPos !== 'function') {
        throw new Error('Invalid getPos')
      }

      const dom = document.createElement('div')
      let selected = false
      const render = () => {
        const C = this.component
        ReactDOM.render(
          <C
            node={node}
            view={view}
            selected={selected}
            getPos={getPos}
            clientID={this.options.clientID}
            onInited={e => {
              if (node.attrs.editorId) {
                this.monacoEditorInstances.set(node.attrs.editorId, e)
              }
            }}
          />,
          dom
        )
      }
      render()

      return {
        dom,
        update: updatedNode => {
          if (updatedNode.type !== node.type) {
            return false
          }
          node = updatedNode
          render()
          return true
        },
        setSelection: () => {
          if (view.editable) {
            selected = true
            render()
          }
        },
        selectNode: () => {
          if (view.editable) {
            selected = true
            render()
          }
        },
        deselectNode: () => {
          selected = false
          render()
        },
        stopEvent: () => true,
        ignoreMutation: () => true,
        destroy: () => {
          ReactDOM.unmountComponentAtNode(dom)
        },
      }
    }
  }

  component = MonacoEditor
}

const MonacoEditor = ({
  node,
  view,
  selected,
  getPos,
  onInited,
  clientID,
}: {
  node: ProsemirrorNode
  view: EditorView
  selected: boolean
  getPos: boolean | (() => number)
  onInited?: (e: { contentManager: EditorContentManager }) => void
  clientID?: string | number
}) => {
  if (typeof getPos !== 'function') {
    throw new Error('Invalid getPos')
  }

  const editorContainer = useRef<HTMLDivElement>(null)
  const MonacoEditor = useRef<Monaco>()
  const monacoEditor = useRef<ICodeEditor>()
  const contentManager = useRef<EditorContentManager>()
  const update = useUpdate()

  const language = node.attrs.language || 'plaintext'

  useEffect(() => {
    Promise.all([import('monaco-editor'), import('@convergencelabs/monaco-collab-ext')]).then(
      ([monaco, { EditorContentManager }]) => {
        MonacoEditor.current = monaco.editor
        if (!editorContainer.current) {
          return
        }
        const editor = monaco.editor.create(editorContainer.current, {
          value: node.textContent,
          language,
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
          scrollbar: {
            verticalScrollbarSize: 0,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: false,
          },
          renderWhitespace: 'all',
          readOnly: !view.editable,
          scrollBeyondLastLine: false,
        })
        contentManager.current = new EditorContentManager({
          editor,
          remoteSourceId: clientID?.toString(),
          onInsert: (index, text) => {
            const pos = getPos() + 1
            view.dispatch(view.state.tr.insertText(text, pos + index))
          },
          onReplace: (index, length, text) => {
            const pos = getPos() + 1
            view.dispatch(view.state.tr.insertText(text, pos + index, pos + index + length))
          },
          onDelete: (index, length) => {
            const pos = getPos() + 1
            view.dispatch(view.state.tr.delete(pos + index, pos + index + length))
          },
        })
        onInited?.({ contentManager: contentManager.current })
        monacoEditor.current = editor
        const updateHeight = () => {
          const contentHeight = editor.getContentHeight()
          editor.getDomNode()!.style.height = `${contentHeight}px`
          editor.layout({ width: editorContainer.current!.clientWidth, height: contentHeight })
        }
        editor.onDidContentSizeChange(updateHeight)
        updateHeight()

        update()
      }
    )

    return () => {
      contentManager.current?.dispose()
      monacoEditor.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!selected) {
      return
    }
    const model = monacoEditor.current?.getModel()
    if (monacoEditor.current && model) {
      monacoEditor.current.focus()
      monacoEditor.current.setPosition(model.getPositionAt(model.getValueLength()))
    }
  }, [selected, monacoEditor.current])

  useEffect(() => {
    monacoEditor.current?.updateOptions({ readOnly: !view.editable })
  }, [view.editable])

  useEffect(() => {
    const model = monacoEditor.current?.getModel()
    if (model) {
      MonacoEditor.current?.setModelLanguage(model, language)
    }
  }, [language])

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    view.dispatch(
      view.state.tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        language: e.target.value,
      })
    )
  }, [])

  return (
    <_RootContainer>
      <select value={language} onChange={handleLanguageChange} disabled={!view.editable}>
        {LANGUAGES.map(lang => (
          <option key={lang} label={lang} value={lang} />
        ))}
      </select>
      <div ref={editorContainer} />
    </_RootContainer>
  )
}

const _RootContainer = styled.div`
  user-select: none;
  margin: 16px 0;
`

const LANGUAGES = [
  'abap',
  'aes',
  'apex',
  'azcli',
  'bat',
  'c',
  'cameligo',
  'clojure',
  'coffeescript',
  'cpp',
  'csharp',
  'csp',
  'css',
  'dart',
  'dockerfile',
  'ecl',
  'fsharp',
  'go',
  'graphql',
  'handlebars',
  'hcl',
  'html',
  'ini',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'less',
  'lexon',
  'lua',
  'm3',
  'markdown',
  'mips',
  'msdax',
  'mysql',
  'objective-c',
  'pascal',
  'pascaligo',
  'perl',
  'pgsql',
  'php',
  'plaintext',
  'postiats',
  'powerquery',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'redis',
  'redshift',
  'restructuredtext',
  'ruby',
  'rust',
  'sb',
  'scala',
  'scheme',
  'scss',
  'shell',
  'sol',
  'sql',
  'st',
  'swift',
  'systemverilog',
  'tcl',
  'twig',
  'typescript',
  'vb',
  'verilog',
  'xml',
  'yaml',
]
