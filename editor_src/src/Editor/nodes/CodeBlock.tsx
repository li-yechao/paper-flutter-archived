import styled from '@emotion/styled'
import { editor } from 'monaco-editor'
import { InputRule, textblockTypeInputRule } from 'prosemirror-inputrules'
import { Node as ProsemirrorNode, NodeSpec, NodeType } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import React, { useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useUpdate } from 'react-use'
import Node, { NodeViewCreator } from './Node'

export default class CodeBlock extends Node {
  get name(): string {
    return 'code_block'
  }

  get schema(): NodeSpec {
    return {
      attrs: { language: { default: null } },
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

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [
      textblockTypeInputRule(/^```([a-z]+)?\s$/, type, match => ({
        language: match[1],
      })),
    ]
  }

  get nodeView(): NodeViewCreator {
    return ({ node, view, getPos }) => {
      const dom = document.createElement('div')
      let selected = false
      const render = () => {
        const C = this.component
        ReactDOM.render(<C node={node} view={view} selected={selected} getPos={getPos} />, dom)
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
}: {
  node: ProsemirrorNode
  view: EditorView
  selected: boolean
  getPos: boolean | (() => number)
}) => {
  const editorContainer = useRef<HTMLDivElement>(null)
  const MonacoEditor = useRef<typeof editor>()
  const monacoEditor = useRef<editor.IStandaloneCodeEditor>()
  const update = useUpdate()

  const language = node.attrs.language || 'plaintext'

  useEffect(() => {
    import('monaco-editor').then(mod => {
      MonacoEditor.current = mod.editor
      if (!editorContainer.current) {
        return
      }
      const editor = mod.editor.create(editorContainer.current, {
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
      monacoEditor.current = editor
      const updateHeight = () => {
        const contentHeight = editor.getContentHeight()
        editor.getDomNode()!.style.height = `${contentHeight}px`
        editor.layout({ width: editorContainer.current!.clientWidth, height: contentHeight })
      }
      editor.onDidContentSizeChange(updateHeight)
      editor.onDidChangeModelContent(({ changes }) => {
        if (typeof getPos === 'function') {
          const start = getPos() + 1
          let tr = view.state.tr
          for (const change of changes) {
            tr = tr.replaceWith(
              start + change.rangeOffset,
              start + change.rangeOffset + change.rangeLength,
              change.text ? view.state.schema.text(change.text) : (null as any)
            )
          }
          view.dispatch(tr)
        }
      })
      updateHeight()

      update()
    })

    return () => monacoEditor.current?.dispose()
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
    if (typeof getPos === 'function') {
      view.dispatch(
        view.state.tr.setNodeMarkup(getPos(), undefined, {
          language: e.target.value,
        })
      )
    }
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
