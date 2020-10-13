const { app, BrowserWindow } = require('electron');
const AnyProxy = require('anyproxy');
const options = {
  port: 8001,
  rule: {
    summary: 'electron-anyproxy',
    beforeSendRequest (request) {
      console.log(request)
      return Promise.resolve(null)
    }
  },
  webInterface: {
    enable: true,
    webPort: 8002
  },
  throttle: 10000,
  forceProxyHttps: false,
  wsIntercept: false, // 不开启websocket代理
  silent: false
};

let mainWindow;

app.on('ready', () => {
  const proxyServer = new AnyProxy.ProxyServer(options);

  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  proxyServer.on('ready', () => {
    mainWindow.loadURL('http://127.0.0.1:8002');
  });
  proxyServer.on('error', (e) => { /* */ });
  proxyServer.start();

});