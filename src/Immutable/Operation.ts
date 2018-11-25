import { Log } from "./Log";
import { PureOperation } from "./PureOperation";
import { Result, retry } from "./Result";
import { RetryOperation } from "./RetryOperation";
import { AbstractLog } from "../AbstractLog";
import { TimeoutOperation } from "./TimeoutOperation";
import { Trampoline } from "./Trampoline";

export interface Operation<Outer, Inner, Action> {
  execute(outer: Outer, log: Log<Outer, Action>): Trampoline<Outer, Inner, Action>
  map<NewInner>(fn: (inner: Inner) => NewInner): Operation<Outer, NewInner, Action>
  flatMap<NewInner>(fn: (inner: Inner) => Operation<Outer, NewInner, Action>): Operation<Outer, NewInner, Action>
  assign<Inner extends object, K extends string | number | symbol, V>(this: Operation<Outer, Inner, Action>, key: K, valueOperation: Operation<Outer, V, Action>): Operation<Outer, Inner & { [KK in K]: V }, Action>
}

export const Operation = {
  pure<Outer, Inner, Action>(inner: Inner) {
    return new PureOperation<Outer, Inner, Action>(inner)
  },
  retry<Outer, Inner, Action>() {
    return new RetryOperation<Outer, Inner, Action>()
  },
  timeout<Outer, Action>(delay: number) {
    return new TimeoutOperation<Outer, Action>(delay)
  },
  onChange<Outer, Inner, Action>(oldOuter: Outer, newOuter: Outer, operation: Operation<Outer, Inner, Action>, oldLog: Log<Outer, Action>) {
    if (AbstractLog.hasNotChanged(oldOuter, newOuter, oldLog)) {
      return retry(oldLog)
    } else {
      return operation.execute(newOuter, new Log([]))
    }
  }
}