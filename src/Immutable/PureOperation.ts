import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";

export class PureOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {

  constructor(private readonly inner: Inner) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    return Promise.resolve(good(this.inner, log))
  }
}