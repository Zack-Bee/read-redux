// Redux中间件api

import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 * 创建一个应用了中间件(middleware)到Redux store的dispatch方法的store扩展(enhancer).
 * 这对于很多任务都是非常容易的, 比如用简单的方式表示(expressing))异步的actions, 或者
 * 记录每个action的荷载.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 * 你可以看`redux-thunk`作为Redux中间件(middleware)的例子
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 * 因为中间件(middleware)可能是异步的, 它应该成为在composition chain中的第一个store 
 * enhancer.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 * 注意每个中间件都会被给予dispatch与getState函数作为命名的参数.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * 将被使用的middleware chain
 * @returns {Function} A store enhancer applying the middleware.
 * 一个使用了middleware的store enhancer
 */
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)

    // 不能理解为什么要这样写, js是单线程的, 运行下面内容时js线程不会运行其他东西吧
    // 在https://github.com/ecmadao/Coding-Guide/blob/master/Notes/React/Redux/Redux%E5%85%A5%E5%9D%91%E8%BF%9B%E9%98%B6-%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90.md
    // 这个里面, 源码没有下面这样写, 而是var dispatch就完了
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))

    // 经过中间件处理后的dispatch
    dispatch = compose(...chain)(store.dispatch)

    // 返回生成的store
    return {
      ...store,
      dispatch
    }
  }
}
