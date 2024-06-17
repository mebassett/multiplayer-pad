import './App.css'
import Editor from '@monaco-editor/react';


function App() {

  return (
    <>
        <h1>Hello, world!</h1>
        <Editor height="90vh" width="80vw" defaultLanguage="javascript" defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
