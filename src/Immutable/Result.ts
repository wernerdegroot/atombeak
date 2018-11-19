import { Log } from "./Log";

export const GOOD = 'GOOD'

export type Good<Outer, Inner, Action> = {
  type: 'GOOD'
  value: Inner
  log: Log<Outer, Action>
}

export function good<Outer, Inner, Action>(value: Inner, log: Log<Outer, Action>): Good<Outer, Inner, Action> {
  return { type: GOOD, value, log }
}

export const RETRY = 'RETRY'

export type Retry<Outer, Action> = {
  type: 'RETRY'
  log: Log<Outer, Action>
}

export function retry<Outer, Action>(log: Log<Outer, Action>): Retry<Outer, Action> {
  return { type: RETRY, log }
} 

export type Result<Outer, Inner, Action> = Promise<Good<Outer, Inner, Action> | Retry<Outer, Action>>

export const Result = {
  map<Outer, A, B, Action>(result: Result<Outer, A, Action>, fn: (a: A) => B): Result<Outer, B, Action> {
    return result.then(r => {
      if (r.type === GOOD) {
        return good(fn(r.value), r.log)
      } else if (r.type === RETRY) {
        return retry(r.log)
      } else {
        const exhaustive: never = r
        throw new Error(exhaustive)
      }
    })
  }
}