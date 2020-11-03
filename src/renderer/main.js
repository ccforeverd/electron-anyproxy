
const { remote } = require('electron')
const WebSocket = require('ws')

const main = remote.getGlobal('main')

const writeLine = (message = '----') => document.documentElement.innerHTML += `<div>${message}</div>`

writeLine()
writeLine(`ANYPROXY: http://127.0.0.1:${main.ANYPROXY_PORT}`)
writeLine()
writeLine(`ANYPROXY_UI: http://127.0.0.1:${main.ANYPROXY_UI_PORT}`)
writeLine()
writeLine(`WSSERVER: ws://127.0.0.1:${main.WSSERVER_PORT}`)

const ws = new WebSocket(`ws://127.0.0.1:${main.WSSERVER_PORT}`)
ws.on('message', (data) => {
  writeLine()
  writeLine(data)
})
