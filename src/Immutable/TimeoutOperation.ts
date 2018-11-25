import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Trampoline, iter } from "./Trampoline";
import { Operation } from "./Operation";

export class TimeoutOperation<Outer, Action> extends AbstractOperation<Outer, null, Action> {

  constructor(private readonly delay: number) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, never>): Trampoline<Outer, null, Action> {
    return iter(() => 
      new Promise<[Operation<Outer, null, Action>, Log<Outer, Action>]>(resolve => {
        setTimeout(() => {
          resolve([Operation.pure(null), log])
        }, this.delay)
      })
    )
  }
}