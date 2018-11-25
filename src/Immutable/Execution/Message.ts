import { Retry, Good } from "../Result";
import { Operation } from "../Operation";
import { Log } from "../../Mutable";

export const STATE_CHANGED = 'STATE_CHANGED'

export type StateChangedMessage<Outer> = {
  type: 'STATE_CHANGED'
  oldOuter: Outer
  newOuter: Outer
}

export function stateChangedMessage<Outer>(oldOuter: Outer, newOuter: Outer): StateChangedMessage<Outer> {
  return {
    type: STATE_CHANGED,
    oldOuter,
    newOuter
  }
}

export const NEXT_ITERATION = 'NEXT_ITERATION'

export type NextIteration<Outer, Inner, Action> = {
  type: 'NEXT_ITERATION'
  log: Log<Outer, Action>
}

export function nextIteration<Outer, Inner, Action>(log: Log<Outer, Action>): NextIteration<Outer, Inner, Action> {
  return {
    type: NEXT_ITERATION,
    log
  }
}

export const RESULT_RECEIVED = 'RESULT_RECEIVED'

export type ResultReceivedMessage<Outer, Inner, Action> = {
  type: 'RESULT_RECEIVED'
  result: Good<Outer, Inner, Action> | Retry<Outer, Action>
  outer: Outer
}

export function resultReceivedMessage<Outer, Inner, Action>(result: Good<Outer, Inner, Action> | Retry<Outer, Action>, outer: Outer): ResultReceivedMessage<Outer, Inner, Action> {
  return {
    type: RESULT_RECEIVED,
    result,
    outer
  }
}

export type Message<Outer, Inner, Action> = StateChangedMessage<Outer> | NextIteration<Outer, Inner, Action> | ResultReceivedMessage<Outer, Inner, Action>