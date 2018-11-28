import * as Result from '../Result'
import { Message, STATE_CHANGED, RESULT_RECEIVED, NEXT_ITERATION } from './Message'
import { noOp, Command, shouldRestart, shouldContinue } from './Command'
import { Log, APPEND_SUCCESS, RESTART_WITH_OUTER } from '../Log'

export class Retry<Outer, Inner, Action> {
  constructor(private readonly previousAttempt: number, private readonly oldLog: Log<Outer, Action>) {}

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      if (this.oldLog.isConsistentWithOuter(message.newOuter)) {
        return [this, noOp]
      } else {
        const attempt = this.previousAttempt + 1
        const log = Log.create<Outer, Action>(message.newOuter)
        return [new Pending<Outer, Inner, Action>(attempt, log, []), shouldRestart(attempt, log)]
      }
    } else if (message.type === NEXT_ITERATION || message.type === RESULT_RECEIVED) {
      return [this, noOp]
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }
}

export class Pending<Outer, Inner, Action> {
  constructor(private readonly attempt: number, private readonly intermediateLog: Log<Outer, Action>, private readonly intermediateOuters: Outer[]) {}

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      if (this.intermediateLog.isConsistentWithOuter(message.newOuter)) {
        const newIntermediateOuters = [...this.intermediateOuters, message.newOuter]
        return [new Pending(this.attempt, this.intermediateLog, newIntermediateOuters), noOp]
      } else {
        return this.restartWith(message.newOuter)
      }
    } else if (message.type === NEXT_ITERATION) {
      if (this.attempt !== message.attempt) {
        return [this, noOp]
      } else {
        const appendResult = message.log.appendStates(...this.intermediateOuters)
        if (appendResult.type === APPEND_SUCCESS) {
          return [new Pending(this.attempt, appendResult.log, []), shouldContinue(this.attempt, appendResult.log)]
        } else if (appendResult.type === RESTART_WITH_OUTER) {
          return this.restartWith(appendResult.outer)
        } else {
          const exhaustive: never = appendResult
          throw new Error(exhaustive)
        }
      }
    } else if (message.type === RESULT_RECEIVED) {
      if (this.attempt !== message.attempt) {
        return [this, noOp]
      } else {
        if (message.result.type === Result.GOOD) {
          return [new Done(this.attempt, message.result.value, message.result.log), noOp]
        } else if (message.result.type === Result.RETRY) {
          return [new Retry(this.attempt, message.result.log), noOp]
        } else {
          const exhaustive: never = message.result
          throw new Error(exhaustive)
        }
      }
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }

  private restartWith(outer: Outer): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    const newAttempt = this.attempt + 1
    const newLog = Log.create<Outer, Action>(outer)
    return [new Pending(newAttempt, newLog, []), shouldRestart(newAttempt, newLog)]
  }
}

export class Done<Outer, Inner, Action> {
  constructor(private readonly attempt: number, private readonly inner: Inner, private readonly log: Log<Outer, Action>) {}

  getActions() {
    return this.log.getActions()
  }

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      if (this.log.isConsistentWithOuter(message.newOuter)) {
        return [this, noOp]
      } else {
        const attempt = this.attempt + 1
        const log = Log.create<Outer, Action>(message.newOuter)
        return [new Pending(attempt, log, []), shouldRestart(attempt, log)]
      }
    } else if (message.type === NEXT_ITERATION || message.type === RESULT_RECEIVED) {
      return [this, noOp]
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }
}

export type State<Outer, Inner, Action> = Retry<Outer, Inner, Action> | Pending<Outer, Inner, Action> | Done<Outer, Inner, Action>
