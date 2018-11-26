import { Operation } from "./Operation";
import { Log } from "./Log";
import { Result } from "./Result";

export const ITER = 'ITER'

export type Iter<Outer, Inner, Action> = {
  type: 'ITER'
  next: () => Promise<[Operation<Outer, Inner, Action>, Log<Outer, Action>]>
}

export function iter<Outer, Inner, Action>(next: () => Promise<[Operation<Outer, Inner, Action>, Log<Outer, Action>]>): Iter<Outer, Inner, Action> {
  return {
    type: ITER,
    next
  }
}

export const DONE = 'DONE'

export type Done<Outer, Inner, Action> = {
  type: 'DONE'
  value: Result<Outer, Inner, Action>
}

export function done<Outer, Inner, Action>(value: Result<Outer, Inner, Action>): Done<Outer, Inner, Action> {
  return {
    type: DONE,
    value
  }
}

export type Trampoline<Outer, Inner, Action> = Iter<Outer, Inner, Action> | Done<Outer, Inner, Action>

export function run<Outer, Inner, Action>(
  operation: Operation<Outer, Inner, Action>,
  outer: Outer,
  onComplete: (result: Result<Outer, Inner, Action>) => void) {
  const log = Log.create<Outer, Action>(outer)
  const executed = operation.execute(log)
  const rec = (executed: Trampoline<Outer, Inner, Action>) => {
    if (executed.type === ITER) {
      executed.next().then(([operation, log]) => {
        rec(operation.execute(log))
      })
    } else if (executed.type === DONE) {
      onComplete(executed.value)
    } else {
      const exhaustive: never = executed
      throw new Error(exhaustive)
    }
  }
  rec(executed)
}

export function runAsPromise<Outer, Inner, Action>(
  operation: Operation<Outer, Inner, Action>,
  outer: Outer
) {
  return new Promise<Result<Outer, Inner, Action>>(resolve => {
    run(operation, outer, resolve)
  })
}