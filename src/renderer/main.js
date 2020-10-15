
const { remote } = require('electron')
const WebSocket = require('ws')

const main = remote.getGlobal('main')

const writeLine = (message = '<br/>----<br/>') => document.write(message)

writeLine()
writeLine(`ANYPROXY: http://127.0.0.1:${main.ANYPROXY_PORT}`)
writeLine()
writeLine(`WSSERVER: ws://127.0.0.1:${main.WSSERVER_PORT}`)

const ws = new WebSocket(`ws://127.0.0.1:${main.WSSERVER_PORT}`)
ws.on('message', (data) => {
  writeLine()
  writeLine(data)
})
