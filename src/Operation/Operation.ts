import { Log } from "../Log";
import { PureOperation } from "./PureOperation";
import { RetryOperation } from "./RetryOperation";
import { TimeoutOperation } from "./TimeoutOperation";
import { Trampoline } from "../Trampoline";

/**
 * An `Operation<..>` represents a unit of work that 
 * should run within a transaction.
 */
export interface Operation<Outer, Inner, Action> {
  /**
   * We can execute an `Operation<..>` in multiple steps. That's why
   * `execute(..)` returns a `Trampoline<..>` instead of a real result.
   * This gives us the chance to:
   * 
   *   1. Check between steps if the `Outer` changed and restart if necessary.
   * 
   *   2. Stop executing the `Operation<..>` (for instance, when the `Outer` changed);
   */
  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action>

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
  }
}