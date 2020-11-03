const { app, BrowserWindow, screen } = require('electron')
const AnyProxy = require('anyproxy')
const WebSocket = require('ws')
const tcpPortUsed = require('tcp-port-used')
const { EventEmitter } = require('events')

const ruleRedirect = require('./anyproxy/rules/redirect')
const mergeRules = require('./anyproxy/utils/merge-rules')

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
  //   enable: true
  //   // webPort: 8002 // 动态获取
  // },
  // webInterface: false, // 不需要自带的客户端
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

const WINDOW_OPTIONS = {
  // height: 600,
  // width: 800,
  webPreferences: {
    nodeIntegration: true,
    enableRemoteModule: true
  }
}

let mainWindow
let uiWindow
let proxyServer
let wsServer

async function getPorts (startPort = 8001, length = 3) {
  const result = []
  while (true) {
    const isUsed = await tcpPortUsed.check(startPort, '127.0.0.1')
    if (!isUsed) {
      result.push(startPort)
      startPort++
      if (result.length > length) {
        break
      }
    }
  }
  return result
}

async function main () {
  const [anyProxyPort, anyProxyUIPort, wsServerPort] = await getPorts(8001, 3)
  const eventBus = new EventEmitter()
  const { workArea } = screen.getPrimaryDisplay()


  global.main = {
    ANYPROXY_PORT: anyProxyPort,
    WSSERVER_PORT: wsServerPort,
    ANYPROXY_UI_PORT: anyProxyUIPort
  }
  proxyServer = new AnyProxy.ProxyServer(Object.assign({
    port: anyProxyPort,
    webInterface: {
      enable: true,
      webPort: anyProxyUIPort
    },
    rule: mergeRules({
      summary: 'electron-anyproxy',
      beforeSendRequest (request) {
        eventBus.emit('beforeSendRequest', request)
        return Promise.resolve(null)
      }
    }, ruleRedirect)
  }, ANYPROXY_OPTIONS))
  wsServer = new WebSocket.Server(Object.assign({
    port: wsServerPort
  }, WEBSOCKET_OPTIONS))

  mainWindow = new BrowserWindow(Object.assign({
    width: workArea.width / 2,
    x: workArea.x,
    y: workArea.y,
    height: workArea.height
  }, WINDOW_OPTIONS))
  mainWindow.loadFile('../renderer/index.html')

  uiWindow = new BrowserWindow(Object.assign({
    width: workArea.width / 2,
    x: workArea.x + workArea.width / 2,
    y: workArea.y,
    height: workArea.height
  }, WINDOW_OPTIONS))
  uiWindow.loadURL(`http://localhost:${anyProxyUIPort}/`)

  proxyServer.on('ready', () => {
    wsServer.on('connection', ws => {
      eventBus.on('beforeSendRequest', (request) => {
        // console.log(request.requestOptions)
        ws.send(JSON.stringify(request.requestOptions))
      })
    })

    console.log(`[main] anyproxy started at http://127.0.0.1:${anyProxyPort}`)
    console.log(`[main] wsServer started at ws://127.0.0.1:${wsServerPort}`)
    console.log(`[main] wsServerUI started at ws://127.0.0.1:${anyProxyUIPort}`)

    // test
    setInterval(() => {
      require('child_process').exec(
        `curl http://httpbin.org/user-agent --proxy http://127.0.0.1:${anyProxyPort}`
      )
    }, 5000)
  })
  proxyServer.on('error', (e) => { /* */ })
  proxyServer.start()
}

app.on('ready', () => {
  main()
})
