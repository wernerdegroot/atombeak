import { Log } from '../Log'

export const SHOULD_RESTART: 'SHOULD_RESTART' = 'SHOULD_RESTART'

export type ShouldRestart<Outer, Action> = Readonly<{
  type: typeof SHOULD_RESTART
  attempt: number
  log: Log<Outer, Action>
}>

export function shouldRestart<Outer, Action>(attempt: number, log: Log<Outer, Action>): ShouldRestart<Outer, Action> {
  return {
    type: SHOULD_RESTART,
    attempt,
    log
  }
}

export const SHOULD_CONTINUE: 'SHOULD_CONTINUE' = 'SHOULD_CONTINUE'

export type ShouldContinue<Outer, Action> = Readonly<{
  type: typeof SHOULD_CONTINUE
  attempt: number
  log: Log<Outer, Action>
}>

export function shouldContinue<Outer, Action>(attempt: number, log: Log<Outer, Action>): ShouldContinue<Outer, Action> {
  return {
    type: SHOULD_CONTINUE,
    attempt,
    log
  }
}

export const RESOLVE = 'RESOLVE'

export type Resolve<Inner, Action> = {
  type: 'RESOLVE'
  inner: Inner
  actions: Action[]
}

export const NO_OP: 'NO_OP' = 'NO_OP'

export type NoOp = {
  type: typeof NO_OP
}

export const noOp: NoOp = { type: NO_OP }

export type Command<Outer, Inner, Action> = ShouldRestart<Outer, Action> | ShouldContinue<Outer, Action> | Resolve<Inner, Action> | NoOp
