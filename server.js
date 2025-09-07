var diffsync = require(`${__dirname}/diffsync.js`)
console.log('diffsync version ' + diffsync.version)

var port = process.argv[2] ? parseInt(process.argv[2]) : diffsync.port

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

var server = require('http').createServer()
server.listen(port)
console.log('listening on port ' + port)
var wss = new (require('ws').Server)({ server })

diffsync.create_server({
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
