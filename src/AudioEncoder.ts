import { spawn } from 'child_process'
const FFMPEG_BIN = require('ffmpeg-static')

export type AudioSampleFormat = 's8' | 's16le' | 's24le' | 's32le'
export type AudioSampleRate = 8000 | 12000 | 16000 | 24000 | 48000

export interface IAudioEncoderOption {
  sampleFormat: AudioSampleFormat
  sampleRate: number
  channels: number
  codec: string
}

export class AudioEncoder {
  private _options: IAudioEncoderOption

  constructor(
    public src: string,
    public dst: string,
    options?: IAudioEncoderOption
  ) {
    this._options = options || {
      sampleFormat: 's16le',
      sampleRate: 16000,
      channels: 1,
      codec: 'mp3'
    }
  }

  public encode(): Promise<void> {
    return new Promise((resolve, reject) => {
      const p = spawn(FFMPEG_BIN, [
        '-y',
        '-f', this._options.sampleFormat,
        '-ar', this._options.sampleRate.toFixed(0),
        '-ac', this._options.channels.toString(),
        '-acodec', this._options.codec,
        '-i', this.src,
        this.dst
      ])
      p.stdin.end()
      p.on('close', (code: number) => {
        if (code != 0) {
          reject(new Error('ffmpeg exited with code ' + code))
        } else {
          resolve()
        }
      })
    })
  }

}
