import fc from 'fast-check'
import { next as A } from "@automerge/automerge"
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { patchesToEdits } from '../../src/patches.ts'
import { MyDoc } from '../../src/types.ts'

const addsTwo = (a: number, b: number) => a + b

describe('patchesToEdits', () => {
  it('makes edits from Automerge patches so the editor and doc are identical.', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (initText, finalText) => {
      const textModel = monaco.editor.createModel(initText)
      let doc = A.init<MyDoc>()
      doc = A.change(doc, d => {
          d.text = initText
      })

      const patchCallback = patches => {
        const edits = patches
           .map(patchesToEdits(textModel))
           .filter ( (a) : a is monaco.editor.IIdentifiedSingleEditOperation => !!a)
        textModel.applyEdits(edits)
      }

      doc = A.change(doc, {patchCallback}, d => {
        A.updateText(d, ['text'], `${initText},${finalText}`)
      })
      return doc.text === textModel.getValue()
    }))
  })
})
