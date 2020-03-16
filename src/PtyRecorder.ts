import * as os from 'os'
import * as pty from 'node-pty'
import * as stream from 'stream'
import { now, fixed7 } from './Time'

const DEFAULT_SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'sh'

type OnDataCallback = (data: string, time: number) => void
type OnExitCallback = (exitCode: number, signal?: number | undefined) => void

export class PtyRecorder implements pty.IDisposable {
  private _cols: number
  private _rows: number
  private _proc: pty.IPty

  private _stdioDisposable: pty.IDisposable | null = null
  private _disposables: pty.IDisposable[] = []

  private _onDataCbs: OnDataCallback[] = []
  private _onExitCbs: OnExitCallback[] = []

  constructor(cmd: string = DEFAULT_SHELL, args: string[] | string = []) {
    this._proc = pty.spawn(cmd, args, {
      cols: this._cols = process.stdout.columns,
      rows: this._rows = process.stdout.rows,
      cwd: process.env.HOME,
      env: <{ [key: string]: string }>process.env
    })
    this._disposables.push(
      this._proc.onExit(e => {
        this.unbindStdio()
        this._onExitCbs.forEach(cb => cb(e.exitCode, e.signal))
      }),
      this._proc.onData(data => {
        this._onDataCbs.forEach(cb => cb(data, now()))
      })
    )
  }

  public get cols(): number { return this._cols }
  public get rows(): number { return this._rows }

  public bindStdio(): void {
    process.stdout.setDefaultEncoding('utf8')
    process.stdin.on('data', this._proc.write.bind(this._proc))
    process.stdin.setEncoding('utf8')
    process.stdin.setRawMode(true)
    process.stdin.resume()

    this._stdioDisposable = this._proc.onData(data => process.stdout.write(data))
  }

  public unbindStdio(): void {
    process.stdin.removeAllListeners()
    process.stdin.setRawMode(false)
    process.stdin.pause()
    // process.stdin.destroy()

    if (this._stdioDisposable) { this._stdioDisposable.dispose() }
  }

  public onData(cb: OnDataCallback): void { this._onDataCbs.push(cb) }
  public onExit(cb: OnExitCallback): void { this._onExitCbs.push(cb) }

  public dispose(): void {
    this._disposables.forEach(d => d.dispose())
    if (this._stdioDisposable) { this._stdioDisposable.dispose() }
    this._onDataCbs = [] // FIXME: There will be a problem if dispose is called within onExit callback
    this._onExitCbs = []
  }
}

export class PtyStream extends stream.Readable {
  constructor(
    public rec: PtyRecorder,
    public start: number
  ) {
    super()
    this.rec.onData((data, time) => {
      this.push(JSON.stringify([fixed7(time - this.start), 'o', data]) + '\n')
    })
    this.rec.onExit(() => {
      this.push(null)
    })
  }
  // tslint:disable-next-line: naming-convention
  _read() { }
}
