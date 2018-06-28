import * as child from 'child_process'

interface LaunchParams {
  command: string
  args?: string[]
}

export default class Wrapper {
  wrapped: child.ChildProcess
  private launchParams: LaunchParams
  constructor (params: LaunchParams) {
    this.launchParams = params
    this.wrapped = child.spawn(params.command, params.args)
    this.wrapped.stdin.setDefaultEncoding('utf-8')
    this.wrapped.stdout.setEncoding('utf-8')
    this.wrapped.stderr.setEncoding('utf-8')
  }
}
