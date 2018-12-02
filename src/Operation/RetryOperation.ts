import { Operation } from './Operation'
import { Log } from '../Log'
import { retry } from '../Result'
import { Trampoline, done } from '../Trampoline'

export class RetryOperation<Outer, Inner, Action> implements Operation<Outer, Inner, Action> {
  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    return done(retry(log))
  }

  map<NewInner>(_fn: (inner: Inner) => NewInner): Operation<Outer, NewInner, Action> {
    return new RetryOperation()
  }

  flatMap<NewInner>(_fn: (inner: Inner) => Operation<Outer, NewInner, Action>): Operation<Outer, NewInner, Action> {
    return new RetryOperation()
  }

  assign<Inner extends object, K extends string | number | symbol, V>(
    this: Operation<Outer, Inner, Action>,
    _key: K,
    _valueOperation: Operation<Outer, V, Action>
  ): Operation<Outer, Inner & { [KK in K]: V }, Action> {
    return new RetryOperation()
  }
}
