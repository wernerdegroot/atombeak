import { Log } from "./Log";
import { READ } from "../LogItem";
import { AbstractOperation } from "./internal";
import { Result, good } from "./Result";
import { Trampoline, done } from "./Trampoline";

export class ReadOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly reader: (outer: Outer) => Inner, private readonly id: string) {
    super()
  }

  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const fromLog = log.findMostRecentReadOrWrite(this.id)
    if (fromLog === null) {
      const inner = log.fromState(this.reader)
      const updatedLog = log.appendReadOrWrite({type: READ, id: this.id, reader: this.reader, value: inner})
      return done(good(inner, updatedLog))
    } else {
      return done(good(fromLog.value, log))
    }
  }
}