import { Operation } from "./Operation";
import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result, GOOD, RETRY } from "./Result";

export class FlatMappedOperation<Outer, Intermediate, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly operation: Operation<Outer, Intermediate, Action>, private readonly fn: (intermediate: Intermediate) => Operation<Outer, Inner, Action>) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    const executed = this.operation.execute(outer, log)
    return executed.then(result => {
      if (result.type === GOOD) {
        return this.fn(result.value).execute(outer, result.log)
      } else if (result.type === RETRY) {
        return result
      } else {
        const exhaustive: never = result
        throw new Error(exhaustive)
      }
    })
  }
}