import { Range, type editor } from 'monaco-editor'
import { Patch } from "@automerge/automerge"

export const patchesToEdits : (tm: editor.ITextModel) => (patch: Patch) => editor.IIdentifiedSingleEditOperation | null = tm => patch => {
  const textPos = patch.path && patch.path.length > 1 ? Number(patch.path[1]) : 0
  if(patch.action === 'splice') {
    const { lineNumber: line, column: col } = tm.getPositionAt(textPos)
    return { range: new Range(line, col, line, col)
           , text: patch.value
           , forceMoveMarkers: true
           }
  }else if (patch.action === 'del') {
    const { lineNumber: sLine, column: sCol } = tm.getPositionAt(textPos)
    const { lineNumber: eLine, column: eCol } = tm.getPositionAt(textPos + (patch.length || 1))
    return { range: new Range(sLine, sCol, eLine, eCol)
           , text: null
           , forceMoveMarkers: true
           }
  } else return null
}
