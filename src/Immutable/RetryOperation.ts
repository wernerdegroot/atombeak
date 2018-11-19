import { Operation } from "./Operation";
import { Log } from "./Log";
import { Result, retry } from "./Result";

export class RetryOperation<Outer, Inner, Action> implements Operation<Outer, Inner, Action> {
  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    return Promise.resolve(retry(log))
  }

  map<NewInner>(fn: (inner: Inner) => NewInner): Operation<Outer, NewInner, Action> {
    return new RetryOperation()
  }

  flatMap<NewInner>(fn: (inner: Inner) => Operation<Outer, NewInner, Action>): Operation<Outer, NewInner, Action> {
    return new RetryOperation()
  }

  assign<Inner extends object, K extends string | number | symbol, V>(this: Operation<Outer, Inner, Action>, key: K, valueOperation: Operation<Outer, V, Action>): Operation<Outer, Inner & { [KK in K]: V }, Action> {
    return new RetryOperation()
  }
}