#!/usr/bin/env node

var diffsync = require(`${__dirname}/diffsync.js`)
console.log('diffsync version ' + diffsync.version)

// Parse command-line arguments
var [port, cert_file, key_file] = process.argv.slice(2)
port = port ? parseInt(port) : diffsync.port

var bus = require('statebus')()
bus.sqlite_store({save_sync: true})

var channels = {}
for (var key in bus.cache) {
    if (!bus.cache.hasOwnProperty(key)) { continue }
    var o = bus.cache[key]
    if (key.startsWith('commit/')) {
        if (o.commit.delete_me) {
            bus.del(key)
        } else {
            if (!channels[o.channel])
                channels[o.channel] = { commits : {}, members : {} }
            channels[o.channel].commits[o.id] = o.commit
        }
    }
    if (key.startsWith('member/')) {
        if (o.member.delete_me) {
            bus.del(key)
        } else {
            if (!channels[o.channel])
                channels[o.channel] = { commits : {}, members : {} }
            channels[o.channel].members[o.id] = o.member
        }
    }
}

var fs = require('fs')
var server_args = [async (req, res) => {
    res.end(await require('fs').promises.readFile(`${__dirname}/index.html`))
}]

// Only use HTTPS if both cert and key files are provided and exist
var server_type = 'http'
if (cert_file && key_file && fs.existsSync(key_file) && fs.existsSync(cert_file)) {
    server_type = 'https'
    server_args.unshift({
        key : fs.readFileSync(key_file),
        cert : fs.readFileSync(cert_file)
    })
} else if (cert_file || key_file) {
    if (!cert_file || !key_file) {
        console.log('Warning: Both cert_file and key_file must be provided for HTTPS')
        process.exit(1)
    } else {
        console.log('Warning: SSL certificate files not found')
        process.exit(1)
    }
}

var web_server = require(server_type).createServer(...server_args)

web_server.listen(port)
console.log('openning ' + server_type + ' server on port ' + port)
var WebSocket = require('ws')
var wss = new WebSocket.Server({ server : web_server })

var diff_server = diffsync.create_server({
    wss : wss,
    initial_data : channels,
    on_change : function (changes) {
        for (var id in changes.commits) {
            if (!changes.commits.hasOwnProperty(id)) { continue }

            var c = changes.commits[id]
            var key = 'commit/' + id
            bus.save({
                key : key,
                id : id,
                channel : changes.channel,
                commit : c
            })
            if (c.delete_me)
                bus.del(key)
        }
        for (var id in changes.members) {
            if (!changes.members.hasOwnProperty(id)) { continue }

            var m = changes.members[id]
            var key = 'member/' + id + '/of/' + changes.channel
            bus.save({
                key : key,
                id : id,
                channel : changes.channel,
                member : m
            })
            if (m.delete_me)
                bus.del(key)
        }
    }
})
