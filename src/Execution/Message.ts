import { Retry, Good } from "../Result";
import { Log } from "../Log";

export const OUTER_CHANGED = 'OUTER_CHANGED'

export type OuterChangedMessage<Outer> = {
  type: 'OUTER_CHANGED'
  oldOuter: Outer
  newOuter: Outer
}

export function outerChangedMessage<Outer>(oldOuter: Outer, newOuter: Outer): OuterChangedMessage<Outer> {
  return {
    type: OUTER_CHANGED,
    oldOuter,
    newOuter
  }
}

export const NEXT_ITERATION = 'NEXT_ITERATION'

export type NextIteration<Outer, Action> = {
  type: 'NEXT_ITERATION'
  attempt: number
  log: Log<Outer, Action>
}

export function nextIteration<Outer, Action>(attempt: number, log: Log<Outer, Action>): NextIteration<Outer, Action> {
  return {
    type: NEXT_ITERATION,
    attempt,
    log,
  }
}

export const RESULT_RECEIVED = 'RESULT_RECEIVED'

export type ResultReceivedMessage<Outer, Inner, Action> = {
  type: 'RESULT_RECEIVED'
  attempt: number
  result: Good<Outer, Inner, Action> | Retry<Outer, Action>
  outer: Outer
}

export function resultReceivedMessage<Outer, Inner, Action>(attempt: number, result: Good<Outer, Inner, Action> | Retry<Outer, Action>, outer: Outer): ResultReceivedMessage<Outer, Inner, Action> {
  return {
    type: RESULT_RECEIVED,
    attempt,
    result,
    outer
  }
}

export type Message<Outer, Inner, Action> = OuterChangedMessage<Outer> | NextIteration<Outer, Action> | ResultReceivedMessage<Outer, Inner, Action>