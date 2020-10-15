const path = require('path')
const { exec } = require('child_process')
const { app, BrowserWindow } = require('electron')
const AnyProxy = require('anyproxy')
const WebSocket = require('ws')
const tcpPortUsed = require('tcp-port-used')
const { EventEmitter } = require('events')

const ANYPROXY_OPTIONS = {
  // port: 8001, // 动态获取
  // rule: { // 放到下面
  //   summary: 'electron-anyproxy',
  //   beforeSendRequest (request) {
  //     console.log(request)
  //     return Promise.resolve(null)
  //   }
  // },
  // webInterface: {
  //   enable: true,
  //   webPort: 8002
  // },
  webInterface: false, // 不需要自带的客户端
  throttle: 10000,
  forceProxyHttps: false,
  wsIntercept: false, // 不开启websocket代理
  silent: false
}

const WEBSOCKET_OPTIONS = {
  // port: 8003, // 动态获取
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed.
  }
}

let mainWindow
let proxyServer
let wsServer

async function main () {
  let startPort = 8001
  let anyProxyPort
  let wsServerPort
  let eventBus = new EventEmitter()

  const start = () => {
    global.main = {
      ANYPROXY_PORT: anyProxyPort,
      WSSERVER_PORT: wsServerPort
    }
    proxyServer = new AnyProxy.ProxyServer(Object.assign({
      port: anyProxyPort,
      rule: {
        summary: 'electron-anyproxy',
        beforeSendRequest (request) {
          eventBus.emit('beforeSendRequest', request)
          return Promise.resolve(null)
        }
      }
    }, ANYPROXY_OPTIONS))
    wsServer = new WebSocket.Server(Object.assign({
      port: wsServerPort
    }, WEBSOCKET_OPTIONS))

    mainWindow = new BrowserWindow({
      height: 600,
      width: 800,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    })
    mainWindow.loadURL('file://' + path.resolve(__dirname, '../renderer/index.html'))
  
    proxyServer.on('ready', () => {
      wsServer.on('connection', ws => {
        eventBus.on('beforeSendRequest', (request) => {
          console.log(request.requestOptions)
          ws.send(JSON.stringify(request.requestOptions))
        })
      })

      console.log(`[main] anyproxy started at http://127.0.0.1:${anyProxyPort}`)
      console.log(`[main] wsServer started at ws://127.0.0.1:${wsServerPort}`)

      // test
      setInterval(() => {
        exec(`curl http://httpbin.org/user-agent --proxy http://127.0.0.1:${anyProxyPort}`)
      }, 5000)
    })
    proxyServer.on('error', (e) => { /* */ })
    proxyServer.start()
  }

  while (true) {
    const isUsed = await tcpPortUsed.check(startPort, '127.0.0.1')
    
    if (!isUsed) {
      if (!anyProxyPort) {
        anyProxyPort = startPort
        startPort++
        continue
      } else {
        wsServerPort = startPort
        start()
        break
      }
    }
  }
}

app.on('ready', () => {
  main()
})
