import * as stream from 'stream'
import { SpeechRecorder } from 'speech-recorder'

export class AudioRecorderStream extends stream.Readable {
  private _finished: boolean = false
  private _rec: SpeechRecorder
  constructor(public sampleRate: number) {
    super()
    this._rec = new SpeechRecorder({ sampleRate })
  }
  public start(): void {
    this._rec.start({
      onAudio: (data: Buffer) => {
        if (!this._finished) { this.push(data) }
      }
    })
  }
  public stop(): void {
    this._finished = true
    this._rec.stop()
    this.push(null)
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _read(): void { }
}
