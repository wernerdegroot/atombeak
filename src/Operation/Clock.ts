export type Clock = {
  after(delay: number): Promise<null>
}

export const defaultClock: Clock = {
  after(delay: number) {
    return new Promise<null>(resolve => {
      setTimeout(() => resolve(null), delay)
    })
  }
}

export type TestClock = Clock & {
  setTime(time: number): void
}

export function testClock(startTime: number): TestClock {
  type Listener = { callback: () => void; atTime: number }
  let listeners: Listener[] = []
  let currentTime = startTime
  return {
    after(delay: number) {
      return new Promise<null>(resolve => {
        if (delay <= 0) {
        } else {
          const listener: Listener = {
            callback: () => resolve(null),
            atTime: currentTime + delay
          }
          listeners.push(listener)
        }
      })
    },
    setTime(time: number) {
      currentTime = time
      listeners.forEach(listener => {
        if (listener.atTime <= currentTime) {
          listener.callback()
        }
      })
      listeners = listeners.filter(listener => listener.atTime > currentTime)
    }
  }
}
