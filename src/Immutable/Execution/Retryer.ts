import { Log } from "../../Mutable";
import * as Result from "../Result";
import { Message, STATE_CHANGED, RESULT_RECEIVED, NEXT_ITERATION } from "./Message";
import { noOp, Command, shouldExecute } from "./Command";

export class Retry<Outer, Inner, Action> {

  constructor(private readonly oldLog: Log<Outer, Action>) {

  }

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      if (Log.hasNotChanged(message.oldOuter, message.newOuter, this.oldLog)) {
        return [this, noOp]
      } else {
        return [new Pending<Outer, Inner, Action>([], new Log([]), message.newOuter), shouldExecute(message.newOuter)]
      }
    } else if (message.type === NEXT_ITERATION) {
      throw new Error('Next iteration while in state `Retry`')
    } else if (message.type === RESULT_RECEIVED) {
      throw new Error('Result received while in state `Retry`')
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }
}

export class Pending<Outer, Inner, Action> {

  constructor(
    private readonly intermediateOuters: Outer[],
    private readonly intermediateLog: Log<Outer, Action>,
    private readonly originalOuter: Outer) {

  }

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      this.intermediateOuters.push(message.newOuter)
      return [this, noOp]
    } else if (message.type === NEXT_ITERATION) {
      return [new Pending(this.intermediateOuters, message.log, this.originalOuter), noOp]
    } else if (message.type === RESULT_RECEIVED) {
      if (message.result.type === Result.GOOD) {
        const outersToCheck = [...this.intermediateOuters, message.outer]
        if (outersToCheck.every(outer => message.result.log.hasNotChanged(outer))) {
          return [new Done(message.result.value, message.result.log), noOp]
        } else {
          return [new Pending([], new Log([]), message.outer), shouldExecute(message.outer)]
        }
      } else if (message.result.type === Result.RETRY) {
        if (Log.hasNotChanged(this.originalOuter, message.outer, message.result.log)) {
          return [this, noOp]
        } else {
          return [new Pending([], new Log([]), message.outer), shouldExecute(message.outer)]
        }
      } else {
        const exhaustive: never = message.result
        throw new Error(exhaustive)
      }
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }
}

export class Done<Outer, Inner, Action> {
  constructor(private readonly inner: Inner, private readonly log: Log<Outer, Action>) {

  }

  getActions() {
    return this.log.getActions()
  }

  next(message: Message<Outer, Inner, Action>): [State<Outer, Inner, Action>, Command<Outer, Inner, Action>] {
    if (message.type === STATE_CHANGED) {
      if (this.log.hasNotChanged(message.newOuter)) {
        return [this, noOp]
      } else {
        return [new Pending<Outer, Inner, Action>([], new Log([]), message.newOuter), shouldExecute(message.newOuter)]
      }
    } else if (message.type === NEXT_ITERATION) {
      throw new Error('Next iteration while in state `Done`')
    } else if (message.type === RESULT_RECEIVED) {
      throw new Error('Result received while in state `Done`')
    } else {
      const exhaustive: never = message
      throw new Error(exhaustive)
    }
  }
}

export type State<Outer, Inner, Action> = Retry<Outer, Inner, Action> | Pending<Outer, Inner, Action> | Done<Outer, Inner, Action>