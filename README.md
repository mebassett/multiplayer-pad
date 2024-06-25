# running

see frontend/README.md and backend/README.md

but basically
nvm use
npm install
npm run dev

# about 

So we have a collaborative text editor built with monaco and automerge.
it's 
 - scalable (which I took to mean large files, since we say two users in the spec explicitly)
 - secure....ish?  I didn't actually take any particular security percuations.
 - tested - in that I wrote a test for it
 - and stable in that I usually cannot crash it (though there is a way, I'll get to that later...)
 

two users can edit it on different internet connections

if you lose your connection, you can keep editing (@automerge/automerge-repo magic)

you can undo and redo changes (just works) and there is a crud historical version restore.

it's using websockets.

For an overview of the arch, check out commit 9207fe52f5f789545f5b1b7ecc06a1370dd410e5

The websocket implementation is exactly the reference implementation from the 
@automerge/automerge-repo example.

The frontend in src/App.tsx is super short, and shows how to combine 
@automerge/automerge-repo with @monaco-editor/react to get a super simple 
collaborative editor.

@monaco-editor/react is a thin layer to make the editor easy to work with from
react.

The key differences between that commit and the final one are the use of 
`useHandle` instead of `useDocument` and using `executeEdits` from 
IStandaloneEditor directly rather than using the `value` attribute from 
@monaco-editor/react.  The reasons for these changes are in the commit messages.

# Other thoughts about building...

I've never used webrtc before, so initially I thought I'd try that.  
I thought I'd modify @automerge/mpl (see my fork) to to peer-2-peer signalling via qr codes
or something, so you'd have a [mostly] serverless approach.

Alas mpl provied to be a bit too messy - I could not even get its own tests to run.
Curiously, its most important test was disabled! 

I thought about using Trystero - but by then I had sunk too much time into webrtc.

So on to websockets!

The trouble with websockets is that you don't really get to see my write much backend code.
The reference implementation for NodeWSServerAdapter in @automerge/automerge-repo 
basically JustWorks.
https://github.com/automerge/automerge-repo/blob/main/packages/automerge-repo-network-websocket/src/NodeWSServerAdapter.ts

So with that we come to commit 9207fe52f5f789545f5b1b7ecc06a1370dd410e5
Very simple implementation using @monaco-editor/react

The trouble with this implementation is that it is
(1) slow on large files; and 
(2) the cursor moves around a lot.

Both of these things come down to 
https://github.com/suren-atoyan/monaco-react/blob/f7cac39fbad0f062dc66458831aaf57a7126dd40/src/Editor/Editor.tsx#L106

It turns out that our react loader is calling getFullModelRange when it updates the editor's text, which nukes everything.

So we started implementing our own diff between the editor and the automerge doc.

We also put in cursor tracking and a very crude version history.

Really, if you're going to do version history, you want something like VIMs undo tree and time travel undo.

But I was running out of time for a slick UI for this, so I just put this together using document Heads
(https://github.com/automerge/automerge-repo/blob/main/packages/automerge-repo/src/DocHandle.ts#L301)
and Automerge view (https://automerge.org/automerge/api-docs/js/functions/next.view.html)

The resulting code has a lot of statefulness to track.

I'd probably not do this for a real app - I'd probably use a Model / Update / View paradigm like elm, or like sticking to redux much more closely, and putting all these handler events for doc changes and ephemeral messages as their own messages that get dispatched to the model.

Now on to testing!  

Most of the heavy lifting is done by automerge and monaco.

We just have some glue code, basically, and event handlers.
Easiest way to test this would be to write an e2e test in cypress to check the functionality
around version switching or remote editing.  You'd likely need two instances, which I am not 100% 
sure how to set it up.  At the very least you could drop to selenium (god forbid!)

Apart from e2e testing, there is one piece of critical logic I introduced in later commits - to go from
Automerge patches to Monaco edits.

I decided this would be a good use of Property-based testing, as I have a property
"Does the value of the editor match the value of the Automerge doc" that I always want to be 
true following various actions.

The actual test I wrote doesn't have the a great Arbitrary instance - I'm just using 
two strings - to come up with arbitrary doc changes.  Naively, I thought I could just
write an Arbitrary for the patches themselves, but then I'd need code to modify the doc
using those patches, as Automerge doesn't take them in its changes function, it only results in them.

It's certainly possible to write better arbitraries here, but I'm out of time.

Hope you enjoy it!


