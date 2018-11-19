import { Operation } from "./Operation";
import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result } from "./Result";

export class MappedOperation<Outer, Intermediate, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly operation: Operation<Outer, Intermediate, Action>, private readonly fn: (intermediate: Intermediate) => Inner) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    const executed = this.operation.execute(outer, log)
    return Result.map(executed, this.fn)
  }
}