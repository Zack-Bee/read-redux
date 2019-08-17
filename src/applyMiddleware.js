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
export default function applyMiddleware(...middlewares) { // 返回强化后的store
  return createStore => (...args) => {
    const store = createStore(...args)

    // 在使用middlewares的时候调用dispatch抛出错误
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

    /**
     * 书写的middleware原本都是store => next => action => {}，经此之后能够通过闭包访问到{ getState, dispatch }了
     * 变为了next => action => {}
     */
    const chain = middlewares.map(middleware => middleware(middlewareAPI))

    // 经过中间件处理后的dispatch，强化了dispatch
    /**
     * 主要通过reduce，将a: next => action => {}, b: next => action => {}
     * 变为一个函数a(b(c(d(...args))))，d接收store.dispatch作为next参数，d(store.dispatch)作为c的next参数
     */
    dispatch = compose(...chain)(store.dispatch)

    // 返回生成的store
    return {
      ...store,
      dispatch
    }
  }
}
