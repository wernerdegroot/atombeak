import { Retry, Good } from "../Result";

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

export type Message<Outer, Inner, Action> = StateChangedMessage<Outer> | ResultReceivedMessage<Outer, Inner, Action>