import chalk from 'chalk'
import * as fs from 'fs'
// import * as portAudio from 'node-portaudio'
import { AudioEncoder } from './AudioEncoder'
import { PtyRecorder, PtyStream } from './PtyRecorder'
import { fixed7, now } from './Time'
import { fileAppendSync, writeJsonSync } from './Utils'

const sampleRate = 16000
const channels = 1

const audioPath = 'audio.pcm'
const castPath = 'out.cast'
const evtPath = 'evt.json'

console.log(chalk.yellow.inverse.bold('Recording...'))

import { SpeechRecorder } from "speech-recorder"

const recorder = new SpeechRecorder({ sampleRate })
const writeStream = fs.createWriteStream(audioPath)

const start = now()
recorder.start({
  onAudio: (audio: Buffer) => {
    writeStream.write(audio)
  }
})

// const au = new portAudio.AudioInput({
//   channelCount: channels,
//   sampleFormat: portAudio.SampleFormat16Bit,
//   sampleRate
// })
// const pcmStream = fs.createWriteStream(audioPath)
// au.pipe(pcmStream)
// au.start()

const rec = new PtyRecorder()
const ptyStream = new PtyStream(rec, start)
const evtStream = fs.createWriteStream(evtPath)

ptyStream.pipe(evtStream)

rec.bindStdio()
rec.onExit(async () => {
  console.log(chalk.green.inverse.bold('Stop Recording'))
  // pcmStream.end()
  // evtStream.end()
  recorder.stop()
  // au.quit()

  const encoder = new AudioEncoder(audioPath, 'out.mp3', {
    channels,
    sampleRate,
    codec: 'pcm_s16le',
    sampleFormat: 's16le'
  })
  await encoder.encode()

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
