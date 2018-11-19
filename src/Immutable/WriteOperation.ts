import { Log } from "./Log";
import { WRITE } from "../LogItem";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";

export class WriteOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly inner: Inner, private readonly id: string, private readonly action: Action) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    const updatedLog = log.append({type: WRITE, id: this.id, value: this.inner, action: this.action })
    return Promise.resolve(good(this.inner, updatedLog))
  }
}