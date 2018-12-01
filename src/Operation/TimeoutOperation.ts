import { Log } from '../Log'
import { AbstractOperation } from './internal'
import { Trampoline, iter } from '../Trampoline'
import { Operation } from './Operation'
import { Clock, defaultClock } from './Clock'

export class TimeoutOperation<Outer, Action> extends AbstractOperation<Outer, null, Action> {
  constructor(private readonly delay: number, private readonly clock: Clock = defaultClock) {
    super()
  }

  execute(log: Log<Outer, never>): Trampoline<Outer, null, Action> {
    return iter(() => this.clock.after(this.delay).then((): [Operation<Outer, null, Action>, Log<Outer, Action>] => [Operation.pure(null), log]))
  }
}
