import { Operation } from "./Operation";
import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result } from "./Result";
import { Trampoline, iter, ITER, done, DONE } from "./Trampoline";

export class MappedOperation<Outer, Intermediate, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly operation: Operation<Outer, Intermediate, Action>, private readonly fn: (intermediate: Intermediate) => Inner) {
    super()
  }

  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const executed = this.operation.execute(log)
    if (executed.type === ITER) {
      return iter(() => {
        return executed.next().then<[Operation<Outer, Inner, Action>, Log<Outer, Action>]>(([operation, log]) => {
          const mappedOperation = new MappedOperation(operation, this.fn)
          return [mappedOperation, log]
        })
      })
    } else if (executed.type === DONE) {
      return done(Result.map(executed.value, this.fn))
    } else {
      const exhaustive: never = executed
      throw new Error(exhaustive)
    }
  }
}