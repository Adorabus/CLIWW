import * as child from 'child_process'
import {EventEmitter} from 'events'
import {secondsAgo} from './util'

export interface WrapperOptions {
  keepalive?: boolean
}

export class Wrapper extends EventEmitter {
  wrapped?: child.ChildProcess
  startedAt?: Date
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

    this.startedAt = new Date()

    const spawned = child.spawn(this.command, this.args)
    spawned.stdin.setDefaultEncoding('utf-8')
    spawned.stdout.setEncoding('utf-8')
    spawned.stderr.setEncoding('utf-8')

    spawned.on('error', (e) => {
      console.log(`-cliww: ${this.command}: command not found`)
      process.exit(1)
    })

    spawned.on('exit', (code, signal) => {
      this._isAlive = false
      this.emit('exit', code, signal)

      if (this.options.keepalive && this.startedAt) {
        if (secondsAgo(this.startedAt.valueOf()) > 5) {
          this.emit('message', 'Restarting wrapped process...')
          this.startProcess()
        } else {
          this.emit('message', 'Process exited too quickly. Keepalive ignored.')
        }
      }
    })

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
    if (this.wrapped.stdin && this.wrapped.stdin.writable) {
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
