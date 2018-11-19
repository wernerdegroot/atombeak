import { Log } from "./Log";
import { Lens } from "../Lens";
import { READ, WRITE } from "../LogItem";

export class Context<Outer, Action> { 

  static fresh<Outer, Action>(outer: Outer): Context<Outer, Action> {
    return new Context(outer, new Log([]))
  }

  constructor(public readonly outer: Outer, public readonly log: Log<Outer, Action>) {

  }

  hasNotChanged(outer: Outer): boolean {
    return this.log.hasNotChanged(outer)
  }

  read<Inner>(lens: Lens<Outer, Inner, Action>): Inner {
    const fromLog = this.log.findMostRecent(lens.id)
    if (fromLog === false) {
      const inner = lens.reader(this.outer)
      this.log.append({type: READ, id: lens.id, reader: lens.reader, value: inner})
      return inner
    } else {
      return fromLog.value
    }
  }

  write<Inner>(lens: Lens<Outer, Inner, Action>, value: Inner): void {
    this.log.append({type: WRITE, id: lens.id, value, action: lens.toAction(value)})
  }
}