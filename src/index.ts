import * as fs from 'fs'
import { AudioEncoder } from './AudioEncoder'
import { PtyRecorder, PtyStream } from './PtyRecorder'
import { now, fixed3 } from './Time'
import { writeJsonSync, fileAppendSync } from './Utils'

const sampleRate = 48000
const channels = 1
const castPath = 'out.cast'
const evtPath = 'evt.json'

const start = now()
const rec = new PtyRecorder()
const ptyStream = new PtyStream(rec, start)
const evtStream = fs.createWriteStream(castPath)

ptyStream.pipe(evtStream)

rec.bindStdio()
rec.onExit(() => {
  evtStream.end()
  writeJsonSync(castPath, {
    version: 2,
    width: rec.cols,
    height: rec.rows,
    duration: fixed3(now() - start)
  })
  fileAppendSync(castPath, evtPath)
  process.exit(0)
})

// rec.onExit(console.log)

// const ai = new portAudio.AudioInput({
//   channelCount: channels,
//   sampleFormat: portAudio.SampleFormat16Bit,
//   sampleRate
// })


// ai.pipe(fs.createWriteStream('audio.pcm'))


// console.log('Recording...')
// ai.start()

// const encoder = new AudioEncoder('./audio.pcm', 'o.ogg', {
//   sampleFormat: 's16le',
//   sampleRate,
//   channels,
//   codec: 'pcm_s16le'
// })

// encoder.encode().then(() => {
//   console.log('done')
// }).catch(console.error)


// setTimeout(() => {
//   console.log('stop')
//   ai.quit()
// }, 2000)
