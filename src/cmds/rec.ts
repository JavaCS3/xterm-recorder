import chalk from 'chalk'
import yargs from 'yargs'
import * as fs from 'fs'
import { AudioRecorderStream } from '../AudioRecorderStream'
import { AudioEncoder } from '../AudioEncoder'
import { PtyRecorder, PtyStream } from '../PtyRecorder'
import { fixed7, now } from '../Time'
import { fileAppendSync, writeJsonSync } from '../Utils'

const sampleRate = 16000
const channels = 1

const audioPath = 'audio.pcm'
const castPath = 'out.cast'
const evtPath = 'evt.json'

export const command = 'rec [-c cmd]'
export const desc = 'Record a terminal session'
export const builder: yargs.CommandBuilder = {
  'c': {
    default: '',
    desc: 'cmd',
    string: true
  }
}
export const handler: (args: yargs.Arguments<{ c: string }>) => void = function (argv) {
  console.log(chalk.yellow.inverse.bold('Recording...'))

  const audioStream = new AudioRecorderStream(sampleRate)
  audioStream.pipe(fs.createWriteStream(audioPath))

  const start = now()
  audioStream.start()

  const cmds = argv.c.split(/\s+/)
  const rec = new PtyRecorder(cmds[0], cmds.slice(1))
  const ptyStream = new PtyStream(rec, start)
  ptyStream.pipe(fs.createWriteStream(evtPath))

  rec.bindStdio()
  rec.onExit(async () => {
    console.log(chalk.green.inverse.bold('Stop Recording'))

    audioStream.stop()

    console.log('Encoding audio')

    const encoder = new AudioEncoder(audioPath, 'out.mp3', {
      channels,
      sampleRate,
      codec: 'pcm_s16le',
      sampleFormat: 's16le'
    })
    await encoder.encode()

    console.log('Encoding finished')

    writeJsonSync(castPath, {
      version: 2,
      width: rec.cols,
      height: rec.rows,
      duration: fixed7(now() - start),
      audio: 'out.mp3'
    })
    fileAppendSync(castPath, evtPath)

    process.exit(0)  // FIXME: Sometimes this won't quit the while process
  })
}
