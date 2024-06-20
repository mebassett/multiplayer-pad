import './App.css'
import Editor, { monaco } from '@monaco-editor/react'
import {Text, next as Automerge } from "@automerge/automerge"
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useDocument } from '@automerge/automerge-repo-react-hooks'
import { MyDoc } from "./types.ts"
import { next as A } from "@automerge/automerge"


function App({ url } : { url: AutomergeUrl} ) {
  const [doc, changeDoc] = useDocument<MyDoc>(url) 

  function onMonacoChange(newValue: string, e: monaco.IModelContentChangedEvent): void {


    changeDoc((d: MyDoc) => {
        A.updateText(d, ["text"], newValue)
    })         
    //console.log(e.changes)
  }

  return (
    <>
        <h1>Hello, world!</h1>

        <p> 
          Count: <strong>{doc?.count ?? 0 }</strong>
        </p>
        <Editor height="90vh"
                width="80vw" 
                onChange={onMonacoChange}
                value={doc?.text || "// multiplayer pad"}
                defaultLanguage="javascript" 

                defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
