import { run as testForGlobal } from './global'
import { run as testForCore } from './core'
import { run as testForZX } from './zx'
import { execa } from 'execa'
import { join } from 'path'

export const run = async () => {
  await testForGlobal()
  await testForCore()
  await testForZX()

  const testForCli = async () => {
    await execa('node', ['./build/cli.js', './test/cli.js'], {
      stdio: 'inherit',
      cwd: join(__dirname, '../'),
    })
  }
  await testForCli()
}

run()
