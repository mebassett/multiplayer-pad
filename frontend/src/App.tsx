import './App.css'
import Editor from '@monaco-editor/react'
import { Range, type editor } from 'monaco-editor';
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useRepo, useHandle, useLocalAwareness, useRemoteAwareness } from '@automerge/automerge-repo-react-hooks'
import { emptyText, MyDoc, EditorState } from "./types.ts"
import { next as A } from "@automerge/automerge"
import {useRef} from 'react'


function App({ userId, url } : { userId: string, url: AutomergeUrl} ) {

  const repo = useRepo()

  const handle = useHandle<MyDoc>(url) || repo.find(url)

  let docRef = useRef(handle.docSync() as MyDoc | undefined) //A.init<MyDoc>()

  const editorRef = useRef(null as null | editor.IStandaloneCodeEditor)

  const [localState, updateLocalState] = useLocalAwareness(
      { handle
      , userId
      , initialState: { cursorPosition: {lineNumber: 1, column:1 }}
      })


  const [peerStates, _] = useRemoteAwareness({ handle, localUserId: userId})

  function handleEditorDidMount(_editor : editor.IStandaloneCodeEditor) {
      editorRef.current = _editor
      _editor.onKeyDown(() => {
          updateLocalState((s: EditorState) => ({...s, cursorPosition: _editor.getPosition() }))
      })
      _editor.onMouseDown(() => {
          updateLocalState((s: EditorState) => ({...s, cursorPosition: _editor.getPosition() }))
      })

      handle.whenReady().then( () => {
        console.log("test")
        return handle.doc()

      }).then ( doc => {
        _editor.executeEdits('', [{
            range: _editor.getModel()!.getFullModelRange()
          , text: doc!.text
          , forceMoveMarkers: false
        }])
      })
  }


  function onMonacoChange(newValue: string | undefined) : void { //, e: Monaco.IModelContentChangedEvent): void {


    handle.change((d: MyDoc) => {
        A.updateText(d, ["text"], newValue || "")
    })
  }

  handle.update( newDoc => {
    if(!docRef.current){
        docRef.current = newDoc
        return newDoc
    }
    if(editorRef.current) {
      const doc = A.clone(docRef.current)

      const binaryChanges = A.getChanges(doc, newDoc)
      A.applyChanges(doc, binaryChanges, { patchCallback: (patches) => {

          const edits = patches.map( (patch:any): editor.IIdentifiedSingleEditOperation => {
            if(patch.action === 'splice') {
              const { lineNumber: line, column: col } = editorRef.current!.getModel()!.getPositionAt(patch.path[1])
              return { range: new Range(line, col, line, col)
                     , text: patch.value
                     , forceMoveMarkers: true
                     }
            }else if (patch.action === 'del') {
              const { lineNumber: sLine, column: sCol } = editorRef.current!.getModel()!.getPositionAt(patch.path[1])
              const { lineNumber: eLine, column: eCol } = editorRef.current!.getModel()!.getPositionAt(patch.path[1] + (patch.length || 1))
              return { range: new Range(sLine, sCol, eLine, eCol)
                     , text: null
                     , forceMoveMarkers: true
                     }
            } else return { range: new Range(0,0,0,0), text: null }
          })
          if(newDoc.text !== doc.text && newDoc.text !== editorRef.current!.getModel()!.getValue())
            editorRef.current!.executeEdits('automerge', edits)

      }})  
      
    }
    docRef.current = newDoc
    return newDoc
  })

  return (
    <>
        <h1>Hello, world!</h1>

        <p> 
          Num peers: <strong>{Object.keys(peerStates).length ?? 0 }</strong>, Last Cursor Position: (line <strong>{localState.cursorPosition.lineNumber}</strong>, column: <strong>{localState.cursorPosition.column}</strong>)
        </p>
        <Editor height="90vh"
                width="80vw" 
                onChange={onMonacoChange}
                onMount={handleEditorDidMount}
                defaultLanguage="javascript" 

                defaultValue={docRef.current ? docRef.current.text : emptyText} />

    </>
  )
}

export default App
