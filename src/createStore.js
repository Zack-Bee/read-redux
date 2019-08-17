// 创建store, 为Redux库的主体

import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 * Creates a Redux store that holds the state tree.
 * 创造一个保持state tree的Redux store
 * The only way to change the data in the store is to call `dispatch()` on it.
 * 改变存储在store里的数据的唯一方法是在store上调用dispatch()方法
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 * 在你的app中只应该存在一个store. 你应该使用combineReducers函数来将多个reducers组合
 * 成一个reducer函数来为state tree的不同部分指定如何相应actions.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 * 一个返回下一个state tree的函数, 用来处理当前state tree和action
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 * 一个初始的state. 你可能在app里可选地指定它来将从服务器获取的state混合, 或者从序列化的
 * 之前的user session里面恢复state.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 * store enhancer(store扩展器?). 你可以可选地指定它来使用第三方功能, 比如middleware(中间件),
 * time travel(时间旅行), persistance(持久化)等等, 来扩展store. Redux自带的唯一的扩展是
 * applyMiddle().
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 * 一个允许你读取state, dispatch(分发)actions和subscribe(订阅)changes(改变)的Redux store
 */
export default function createStore(reducer, preloadedState, enhancer) {

  // 如果只传递两个参数, 第二个参数是函数的话, 默认当作enhancer
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  // 当enhancer合理传入时, 返回经过enhancer处理后的createStore函数
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(reducer, preloadedState)
  }

  // 检查reducer是否为函数
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  let currentReducer = reducer
  let currentState = preloadedState
  let currentListeners = []
  let nextListeners = currentListeners
  let isDispatching = false

  // 确保NextListeners可以突变
  // 在执行listener时，如果subscribe或者unscbscribe都能保证当前的listener队列执行完毕
  // 发生的更改在nextListeners中
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store.
   * 读取被store管理的state
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {

    // 当正处于执行reducer状态时读取state将抛出错误
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   * 添加一个change listener. 任何时候action被分发(dispatched)时, changelistener都
   * 会被调用, 并且state tree的部分可能会被改变. 你可能会在callback()(回调函数里)调用
   * getState()来读取当前的state tree.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   * 你可能会从一个change listener里调用dispatch, 请注意如下几点
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   * 1. 在每次调用dispatch之前subscriptions(订阅)都会生成快照(are snapshotted)
   * 如果你在listener触发时订阅(subscribe)或取消订阅(unsubscribe), 这将不会对正在进行的
   * dispatch产生任何影响. 然而在下一次dispatch()调用时, 无论这个dispatch()是否是嵌套调
   * 用, 都将会使用最近的subscription list(订阅列表)
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   * 2. 因为state可能在listener被调用前, 在一个nested(嵌套的) dispatch()里更新了多次,
   * 所以不应该期望listener能够发现所有的state changes.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * 一个在每次dispatch时触发的回调函数
   *
   * @returns {Function} A function to remove this change listener.
   * 一个移除这个change listener的函数
   */
  // 增加listener到维护的listeners数组, 在每次dispatch时调用
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    // 在dispatch时订阅抛出错误
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

    // 在dispatch时订阅抛出错误
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      isSubscribed = false

      // 从nextListeners中删除listener
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   * 分发一个action. 这是唯一的方法改变state
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   * 用于创建store的reducer函数将会使用当前state tree和给予的action被调用. 它的返回
   * 的值将会被认为是state tree的下一个state, 并且监听改变的listener将会被通知.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   * 基础操作只支持普通的对象(plain object). 如果你想要去分发一个Promise, Observable,
   * Chunk或者一些其他的东西, 你需要将你的store创建函数包裹进相应的中间件(middleware)中.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   * 一个普通对象表示什么被改变了. 保持actions可序列化(serializable)是一个好主意, 这
   * 样你可以记录或者重现(replay)user session, 或者使用时间旅行(time travelling)
   * `redux-devtpools`. 一个action必须有不是undefined的type属性. 使用字符串常量
   * (string constants)表示action type是很好的选择.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   * 为了方便, 返回与你分发(dispatch)相同的action object
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   * 注意, 如果你使用自制的middleware, 它可能包裹dispatch来返回一些其他的(比如一个
   * 你可以await的Promise)
   */
  // 每次调用dispatch, 使用当前的reducer来更新state, 并且遍历调用listeners
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // 遍历调用listener
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   * 替换当前正在被store使用来计算state的reducer
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   * 如果你的app使用了代码拆分了并且你想要动态地加载一些reducers, 或者为Redux使用了
   * 热更新(hot reloading), 那么你可能会需要这个函数.
   *
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * 你想要store使用的reducer
   *
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE }) // 使用nextReducer重新计算state
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * 与observable, reactive库的接口
   * @returns {observable} A minimal observable of state changes.
   * 对state changes的小型的观察
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * 小型的观察订阅方法
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * 可以是能够被当作observer使用的任何对象. observer object应该有一个`next`方法
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       * 一个有着能够用来从store取消订阅(unsubscribe)observable并且阻止从
       * observable获得更多数据的方法的对象.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  // 当一个store创建时, 一个"INIT"的action被分发(dispatched)使得所有的reducer返回
  // 它们的初始state tree.
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
