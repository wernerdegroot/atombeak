import { Log } from "./Log";
import { READ } from "../LogItem";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";
import { Trampoline, done } from "./Trampoline";

export class ReadOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly reader: (outer: Outer) => Inner, private readonly id: string) {
    super()
  }

  execute(outer: Outer, log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const fromLog = log.findMostRecent(this.id)
    if (fromLog === false) {
      const inner = this.reader(outer)
      const updatedLog = log.append({type: READ, id: this.id, reader: this.reader, value: inner})
      return done(good(inner, updatedLog))
    } else {
      return done(good(fromLog.value, log))
    }
  }
}