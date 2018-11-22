export const PICK_UP_FORK = 'PICK_UP_FORK'

export type PickUpFork = {
  type: typeof PICK_UP_FORK
  forkIndex: number
  philospherIndex: number
}

export function pickUpFork(forkIndex: number, philospherIndex: number): PickUpFork {
  return {
    type: PICK_UP_FORK,
    forkIndex,
    philospherIndex
  }
}

export const PUT_DOWN_FORK = 'PUT_DOWN_FORK'

export type PutDownFork = {
  type: typeof PUT_DOWN_FORK
  forkIndex: number
  philospherIndex: number
}

export function putDownFork(forkIndex: number, philospherIndex: number): PutDownFork {
  return {
    type: PUT_DOWN_FORK,
    forkIndex,
    philospherIndex
  }
}

export type Action = PickUpFork | PutDownFork