import * as child from 'child_process'
import {EventEmitter} from 'events'

export interface WrapperOptions {
  keepalive?: boolean
}

export class Wrapper extends EventEmitter {
  wrapped?: child.ChildProcess
  command: string
  args: string[]
  options: WrapperOptions
  private _isAlive: boolean = false

  constructor (command: string, args: string[] = [], options: WrapperOptions = {}) {
    super()
    this.command = command
    this.args = args
    this.options = options
  }

  startProcess () {
    if (this._isAlive) {
      this.stopProcess(true)
    }

    const spawned = child.spawn(this.command, this.args)
    spawned.stdin.setDefaultEncoding('utf-8')
    spawned.stdout.setEncoding('utf-8')
    spawned.stderr.setEncoding('utf-8')

    if (this.options.keepalive) {
      spawned.on('exit', () => {
        setTimeout(() => {
          this.emit('message', 'Restarting wrapped process...')
          this.startProcess()
        }, 1000)
      })
    }

    this.wrapped = spawned
    this._isAlive = true
    this.emit('start', spawned)
  }

  stopProcess (force: boolean) {
    if (!this.wrapped) return
    this.wrapped.kill(force ? 'SIGKILL' : 'SIGINT')
    this._isAlive = false
    this.emit('stop')
  }

  send (command: string): boolean {
    if (!this.wrapped) return false
    if (this.wrapped.stdin.writable) {
      this.wrapped.stdin.write(command)
      return true
    } else {
      return false
    }
  }

  isAlive () {
    return this._isAlive
  }
}
