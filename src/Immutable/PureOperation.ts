import { Log } from "./Log";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";
import { Trampoline, done } from "./Trampoline";

export class PureOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {

  constructor(private readonly inner: Inner) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    return done(good(this.inner, log))
  }
}