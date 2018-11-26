export function filterMap<A, B>(subject: A[], fn: (a: A) => B | null): B[] {
  const result: B[] = []
  subject.forEach(a => {
    const possibleB = fn(a)
    if (possibleB !== null) {
      result.push(possibleB)
    }
  })
  return result
}