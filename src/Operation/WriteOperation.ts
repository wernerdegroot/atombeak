import { Log } from '../Log'
import { AbstractOperation } from './internal'
import { good } from '../Result'
import { Trampoline, done } from '../Trampoline'

export class WriteOperation<Outer, Inner, Action> extends AbstractOperation<Outer, Inner, Action> {
  constructor(private readonly inner: Inner, private readonly id: string, private readonly action: Action) {
    super()
  }

  execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action> {
    const updatedLog = log.write(this.id, this.inner, this.action)
    return done(good(this.inner, updatedLog))
  }
}
