# diffsync

Diffsync is a radical re-interpretation of git's [recursive 3-way merge algorithm](https://public-inbox.org/git/20050826184731.GA13629@c165.ib.student.liu.se/) applied to collaborative text editing.  Git uses this algorithm to merge entire commits of edits.  Here we show this is actually a *great* algorithm to merge keystrokes together in realtime!

This algorithm is remarkably fast, because:
1. We use the amazing [Myer's algorithm](https://www.nathaniel.ai/myers-diff/) for the diffing.
2. We're able to *prune old edit history* away!

How are we able to prune history?  Well, because this algorithm isn't your normal OT or CRDT algorithm... it's actually a generalization of both, called a [Collapsing Time Machine](https://braid.org/time-machines).  CTMs have a bunch of cool properties, such as making history modular — so that different peers can prune different regions of it, while still guaranteeing perfect consistency!

See the index.html file for an example usage.

If you're curious, you can also read up on our early [hypothesizing](https://stackoverflow.com/a/48652362/440344) about the relationship between version control systems and OT and CRDT algorithms.  This was one of our earliest experiments into finding a universal synchronization algorithm and framework, which has now led to the [CTM theory](https://braid.org/time-machines) and the interoperable [Braid synchronization protocols](https://braid.org).

## Wiki Server

Diffsync comes with a built-in collaborative wiki server that demonstrates the power of the algorithm.

### Installation

```bash
npm install -g @braid.org/diffsync
```

### Quick Start

1. Create a data directory for the wiki:
   ```bash
   mkdir my_wiki
   cd my_wiki
   ```
2. Run the diffsync wiki server:
   ```bash
   diffsync
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:60607/any-page-name
   ```

You should see a giant empty text box, and if you open another browser tab to the same URL, you can edit the text collaboratively!

### Configuration

```bash
diffsync [port] [cert_file] [key_file]
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `port` | Port number to serve on | `60607` |
| `cert_file` | SSL certificate file for HTTPS | none |
| `key_file` | SSL key file for HTTPS | none |

**Examples:**

```bash
# Run on a different port
diffsync 8080

# Run with HTTPS
diffsync 443 /path/to/cert.pem /path/to/key.pem
```

### Data Storage

The wiki uses SQLite and will create files like `db.sqlite`, `db.sqlite-shm`, and `db.sqlite-wal` in your current working directory to store all wiki pages and data.
