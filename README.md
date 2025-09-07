# diffsync

Diffsync is a radical re-interpretation of git's [recursive 3-way merge algorithm](https://public-inbox.org/git/20050826184731.GA13629@c165.ib.student.liu.se/) applied to collaborative text editing.  Git uses this algorithm to merge entire commits of edits.  Here we show this is actually a *great* algorithm to merge keystrokes together in realtime!

This algorithm is remarkably fast, because:
1. We use the amazing [Myer's algorithm](https://www.nathaniel.ai/myers-diff/) for the diffing.
2. We're able to *prune old edit history* away!

How are we able to prune history?  Well, because this algorithm isn't your normal OT or CRDT algorithm... it's actually a generalization of both, called a [Collapsing Time Machine](https://braid.org/time-machines).  CTMs have a bunch of cool properties, such as making history modular — so that different peers can prune different regions of it, while still guaranteeing perfect consistency!

If you're curious, you can also read up on our early [hypothesizing](https://stackoverflow.com/a/48652362/440344) about the relationship between version control systems and OT and CRDT algorithms.  This was one of our earliest experiments into finding a universal synchronization algorithm and framework, which has now led to the [CTM theory](https://braid.org/time-machines) and the interoperable [Braid synchronization protocols](https://braid.org).

## How to Use

The diffsync module provides three main functions:
- **Server creation** - Sets up a diffsync websocket server, which handles many documents.
- **Client creation** - Connects to a diffsync websocket server, to a specific document.
- **Core minigit object** - The underlying git-like CRDT that powers the text merging, typically used internally by the client and server, and does not include any web technology itself.

### Server

To run a diffsync websocket server, you have two options:

#### Option 1: Install globally and run from command line

```bash
npm install -g @braid.org/diffsync

diffsync [port] [cert_file] [key_file]
```

This starts a server with a websocket endpoint defaulting to `ws://localhost:60607`.

The server uses SQLite for persistence, creating files like `db.sqlite` in your current working directory.

#### Option 2: Programmatic usage

See [`server.js`](https://github.com/invisible-college/diffsync/blob/gh-pages/server.js) for a complete example of creating a server programmatically within your application.

### Client

For a complete working example, see [`index.html`](https://github.com/invisible-college/diffsync/blob/gh-pages/index.html).

If you have the server running, you can open this file in a couple browser tabs, and experience some collaborative editing.

### Core (minigit)

The core of diffsync is "minigit" - a minimal git-like implementation with two primary operations: `commit` and `merge`. While you typically won't need to use this directly, here's a brief overview via example:

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

Notice how both instances converge to the same state ("AB") regardless of merge order - this is the power of the underlying CRDT-like algorithm.
