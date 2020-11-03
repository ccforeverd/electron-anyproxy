
const _ = require('lodash')

const mergeFunctions = (...functions) => (...args) => {
  return functions.reduce(async (result, func) => {
    func && _.merge(result, await func(...args))
    return result
  }, {})
}

module.exports = function mergeRules (...rules) {
  return [
    'beforeSendRequest',
    'beforeSendResponse',
    'beforeDealHttpsRequest',
    'onError',
    'onConnectError'
  ].reduce((result, functionName) => {
    const functions = rules
      .filter(rule => rule && rule[functionName])
      .map(rule => rule[functionName])
    if (functions.length) {
      result[functionName] = mergeFunctions(...functions)
    }
    return result
  }, {
    summary: `merged-rules: [${rules
      .map((rule, index) => (rule && rule.summary) || `rule-${index + 1}`)
      .join(', ')}]`
  })
}

// module.exports = {
//   // 模块介绍
//   summary: 'my customized rule for AnyProxy',
//   // 发送请求前拦截处理
//   *beforeSendRequest(requestDetail) { /* ... */ },
//   // 发送响应前处理
//   *beforeSendResponse(requestDetail, responseDetail) { /* ... */ },
//   // 是否处理https请求
//   *beforeDealHttpsRequest(requestDetail) { /* ... */ },
//   // 请求出错的事件
//   *onError(requestDetail, error) { /* ... */ },
//   // https连接服务器出错
//   *onConnectError(requestDetail, error) { /* ... */ }
// }
