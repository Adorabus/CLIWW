export interface SetServerOptions {
  keepalive?: boolean
}

const defaultOptions: SetServerOptions = {
  keepalive: false,
}

let currentOptions: SetServerOptions = { ...defaultOptions }

export function setOptions(inputOptions: Partial<SetServerOptions>): void {
  const allowedKeys = Object.keys(defaultOptions) as Array<keyof SetServerOptions>

  for (const key of allowedKeys) {
    if (key in inputOptions) {
      currentOptions[key] = inputOptions[key]
    }
  }
}

export function getOptions(): SetServerOptions {
  return { ...currentOptions }
}
