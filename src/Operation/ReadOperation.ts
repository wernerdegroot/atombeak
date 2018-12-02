import { Log } from '../Log'
import { AbstractOperation } from './internal'
import { good } from '../Result'
import { Trampoline, done } from '../Trampoline'

export class ReadOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly reader: (outer: Outer) => Inner, private readonly id: string) {
    super()
  }

  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const [inner, updatedLog] = log.read(this.id, this.reader)
    return done(good(inner, updatedLog))
  }
}
