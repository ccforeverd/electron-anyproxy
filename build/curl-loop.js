const { exec } = require('child_process')

setInterval(() => {
  exec('curl http://httpbin.org/user-agent --proxy http://127.0.0.1:8001')
}, 5000)
