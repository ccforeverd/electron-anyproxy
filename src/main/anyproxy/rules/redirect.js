/*
  sample:
    redirect all https://httpbin.org/user-agent requests to http://localhost:8008/index.html
  test:
    curl https://httpbin.org/user-agent --proxy http://127.0.0.1:8001
  expected response:
    'hello world' from 127.0.0.1:8001/index.html
*/
module.exports = {
  sammary: 'edu-m',
  async beforeSendRequest(requestDetail) {
    if (requestDetail.url.indexOf('https://edu-m.wps.cn/') === 0) {
      const newRequestOptions = requestDetail.requestOptions
      requestDetail.protocol = 'http'
      newRequestOptions.hostname = 'edu-m.wps.cn'
      newRequestOptions.port = '3000'
      newRequestOptions.path = '/'
      newRequestOptions.method = 'GET'
    }
    return Promise.resolve(requestDetail)
  },
  async beforeDealHttpsRequest(requestDetail) {
    return true
  }
}
