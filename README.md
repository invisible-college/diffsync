# diffsync

Diffsync is a radical re-interpretation of git's [recursive 3-way merge algorithm](https://public-inbox.org/git/20050826184731.GA13629@c165.ib.student.liu.se/) applied to collaborative text editing.  Git uses this algorithm to merge entire commits of edits.  Here we show this is actually a *great* algorithm to merge keystrokes together in realtime!

This algorithm is remarkably fast, because:
1. We use the amazing [Myer's algorithm](https://www.nathaniel.ai/myers-diff/) for the diffing.
2. We're able to *prune old edit history* away!

How are we able to prune history?  Well, because this algorithm isn't your normal OT or CRDT algorithm... it's actually a generalization of both, called a [Collapsing Time Machine](https://braid.org/time-machines).  CTMs have a bunch of cool properties, such as making history modular — so that different peers can prune different regions of it, while still guaranteeing perfect consistency!

If you're curious, you can also read up on our early [hypothesizing](https://stackoverflow.com/a/48652362/440344) about the relationship between version control systems and OT and CRDT algorithms.  This was one of our earliest experiments into finding a universal synchronization algorithm and framework, which has now led to the [CTM theory](https://braid.org/time-machines) and the interoperable [Braid synchronization protocols](https://braid.org).

## Demo

```
git clone https://github.com/invisible-college/diffsync.git
cd diffsync
npm install
node server.js
```
Open `index.html` in a couple browser tabs. Try typing in one tab, and see the edits appear in the other.

## API

```
// in node, include as
var diffsync = require('@braid.org/diffsync')

<!-- in a webpage, include as -->
<script src="https://unpkg.com/@braid.org/diffsync"></script>
```

The `diffsync` module provides three functions:
- `create_server` - Creates a websocket server, see [`server.js`](https://github.com/invisible-college/diffsync/blob/gh-pages/server.js) for a working example.
- `create_client` - Connects to a websocket server, see [`index.html`](https://github.com/invisible-college/diffsync/blob/gh-pages/index.html) for a working example.
- `create_minigit` - The underlying git-like CRDT that powers the text merging, used internally by the client and server. While you typically won't need to use this directly, here's a brief overview via example:

```javascript
// Create two independent minigit instances
var m1 = diffsync.create_minigit()
var c1 = m1.commit("A")

var m2 = diffsync.create_minigit()
var c2 = m2.commit("B")

// Merge changes from m2 into m1
m1.merge(c2)
console.log(m1.cache) // prints "AB"

// Merge changes from m1 into m2
m2.merge(c1)
console.log(m2.cache) // also prints "AB"
```
