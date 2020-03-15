import { PathLike, readFileSync, writeFileSync, appendFileSync } from 'fs'

export function writeJsonSync<T>(path: PathLike | number, json: T, newLineAtEOF: boolean = true): void {
  writeFileSync(path, JSON.stringify(json) + (newLineAtEOF ? '\n' : ''))
}

export function fileAppendSync(path1: PathLike | number, path2: PathLike | number) {
  appendFileSync(path1, readFileSync(path2))
}
