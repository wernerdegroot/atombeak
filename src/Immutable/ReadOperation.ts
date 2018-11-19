import { Log } from "./Log";
import { READ } from "../LogItem";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";

export class ReadOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly reader: (outer: Outer) => Inner, private readonly id: string) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Result<Outer, Inner, Action> {
    const fromLog = log.findMostRecent(this.id)
    if (fromLog === false) {
      const inner = this.reader(outer)
      const updatedLog = log.append({type: READ, id: this.id, reader: this.reader, value: inner})
      return Promise.resolve(good(inner, updatedLog))
    } else {
      return Promise.resolve(good(fromLog.value, log))
    }
  }
}