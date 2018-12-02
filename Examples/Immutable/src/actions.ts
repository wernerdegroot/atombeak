export const PICK_UP_FORK = 'PICK_UP_FORK'

// Let philospher `philosopherIndex` pick up fork `forkIndex`.
export type PickUpFork = Readonly<{
  type: typeof PICK_UP_FORK
  forkIndex: number
  philospherIndex: number
}>

export function pickUpFork(forkIndex: number, philospherIndex: number): PickUpFork {
  return {
    type: PICK_UP_FORK,
    forkIndex,
    philospherIndex
  }
}

export const PUT_DOWN_FORK = 'PUT_DOWN_FORK'

// Let philospher `philosopherIndex` put down fork `forkIndex`.
export type PutDownFork = Readonly<{
  type: typeof PUT_DOWN_FORK
  forkIndex: number
  philospherIndex: number
}>

export function putDownFork(forkIndex: number, philospherIndex: number): PutDownFork {
  return {
    type: PUT_DOWN_FORK,
    forkIndex,
    philospherIndex
  }
}

export type Action = PickUpFork | PutDownFork
