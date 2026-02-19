import { EventEmitter } from 'events'

declare global {
  var __fixitBus: EventEmitter | undefined
}

export function getBus(): EventEmitter {
  if (!global.__fixitBus) {
    global.__fixitBus = new EventEmitter()
    global.__fixitBus.setMaxListeners(100)
  }
  return global.__fixitBus
}
