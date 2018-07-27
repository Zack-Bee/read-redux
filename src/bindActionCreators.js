// 辅助函数, 将actionCreator与dispatch绑定

function bindActionCreator(actionCreator, dispatch) {
  return function() {
    return dispatch(actionCreator.apply(this, arguments))
  }
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 * 将一个值是actionCreator的对象转化为有着相同key, 但每一个creator函数都放进一个
 * dispatch调用, 以便它们能够直接被触发. 这仅仅是一个方便的方法, 你也可以自己调用
 * `store.dispatch(MyActionCreators.doSomething())`
 * 
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 * 为了方便, 你也可以传递单个函数作为第一个参数然后得到一个函数返回
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 * 一个值是action creator函数的对象. 一个简单的方法是使用ES6的`import * as`语法获得
 * 这个对象. 你也可以只传递一个函数.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 * 在你Redux store里可以得到的`dispatch`函数.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 * 是一个和原始对象相似的对象, 但是每一个action creator都被放进`dispatch`调用. 如果你
 * 传递一个函数作为`actionCreators`, 返回值将也是一个函数.
 * 
 */
export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  const keys = Object.keys(actionCreators)
  const boundActionCreators = {}

  // 为每一个value绑定到dispatch里面
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
