// 用于组合函数, 例如compose(a, b, c)等于(...args) => a(b(c(...args)))

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 * 从右到左组合成一个单参数(single-argument)函数. 最右端的函数能够接收多个参数,
 * 因为它为最终的综合函数提供了信息.
 * 
 * @param {...Function} funcs The functions to compose.
 * 要组合的函数.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 * 一个经过从右到左组合参数函数(argument functions)的函数. 例如compose(f, g, h)等于
 * (...args) => f(g(h(args)))
 */

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args))) // 第一次体会到reducer的神奇用法
}
