import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Repo, isValidAutomergeUrl} from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { RepoContext } from "@automerge/automerge-repo-react-hooks"
import { next as A } from "@automerge/automerge"

import { MyDoc, emptyText } from "./types.ts"

const repo = new Repo({ network: [new BrowserWebSocketClientAdapter(`ws://${location.hostname}:3030`)]
                      , storage: new IndexedDBStorageAdapter("qawolf-multiplayer-pad")
                      })



const rootDocUrl = `${document.location.hash.substring(1)}`

const handle = isValidAutomergeUrl(rootDocUrl) 
             ? repo.find(rootDocUrl) 
             : repo.create<MyDoc>(A.from({ text: emptyText }))
const docUrl = (document.location.hash = handle.url)

const userId = `${Math.random()}` // this is not a good idea.


ReactDOM.createRoot(document.getElementById('root')!).render(
<RepoContext.Provider value={repo}>
  <React.StrictMode>
    <App url={docUrl} userId={userId} />
  </React.StrictMode>
  </RepoContext.Provider>,
)
