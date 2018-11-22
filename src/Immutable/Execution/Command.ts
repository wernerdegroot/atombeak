export const SHOULD_EXECUTE = 'SHOULD_EXECUTE'

export type ShouldExecute<Outer> = {
  type: 'SHOULD_EXECUTE'
  outer: Outer
}

export function shouldExecute<Outer>(outer: Outer): ShouldExecute<Outer> {
  return {
    type: SHOULD_EXECUTE,
    outer
  }
}

export const RESOLVE = 'RESOLVE'

export type Resolve<Inner, Action> = {
  type: 'RESOLVE'
  inner: Inner
  actions: Action[]
}

export const NO_OP = 'NO_OP'

export type NoOp = {
  type: 'NO_OP'
}

export const noOp: NoOp = { type: NO_OP }

export type Command<Outer, Inner, Action> = ShouldExecute<Outer> | Resolve<Inner, Action> | NoOp