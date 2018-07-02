export function secondsAgo (timestamp: number) {
  return (Date.now() - timestamp) / 1000
}

export function minutesAgo (timestamp: number) {
  return (Date.now() - timestamp) / 1000 / 60
}
