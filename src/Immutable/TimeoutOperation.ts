import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";

export class TimeoutOperation<Outer, Action> extends AbstractOperation<Outer, null, Action> {

  constructor(private readonly delay: number) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, never>): Result<Outer, null, Action> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(good(null, log))
      }, this.delay)
    })
  }
}