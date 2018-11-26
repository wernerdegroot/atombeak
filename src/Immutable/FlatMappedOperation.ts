import { Operation } from "./Operation";
import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result, GOOD, RETRY, retry } from "./Result";
import { Trampoline, ITER, DONE, iter, done } from "./Trampoline";

export class FlatMappedOperation<Outer, Intermediate, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly operation: Operation<Outer, Intermediate, Action>, private readonly fn: (intermediate: Intermediate) => Operation<Outer, Inner, Action>) {
    super()
  }

  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const executed = this.operation.execute(log)
    if (executed.type === ITER) {
      return iter(() => {
        return executed.next().then<[Operation<Outer, Inner, Action>, Log<Outer, Action>]>(([operation, log]) => {
          const mappedOperation = new FlatMappedOperation(operation, this.fn)
          return [mappedOperation, log]
        })
      })
    } else if (executed.type === DONE) {
      if (executed.value.type === RETRY) {
        return done(retry(executed.value.log))
      } else if (executed.value.type === GOOD) {
        const operation = this.fn(executed.value.value)
        return iter(() => Promise.resolve<[Operation<Outer, Inner, Action>, Log<Outer, Action>]>([operation, executed.value.log]))
      } else {
        const exhaustive: never = executed.value
        throw new Error(exhaustive)
      }
    } else {
      const exhaustive: never = executed
      throw new Error(exhaustive)
    }
  }
}