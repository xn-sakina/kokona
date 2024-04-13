import assert from 'assert'
import '../build/globals'

export const run = async () => {
  // echo
  await $`echo "Hello, World!"`
  const { stdout } = await $`echo "Hello, World!"`
  assert(stdout.includes('Hello, World!'))

  // cd
  await cd('..')
  await $`pwd`
  await cd('./test')

  // fetch
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  const json = await res.json()
  assert(json.userId === 1)

  // sleep
  await sleep(100)

  // yaml
  const foo = YAML.parse('foo: bar').foo
  assert(foo === 'bar')

  // glob
  const files = await glob(path.join(__dirname, './*.ts'), {
    dot: true,
    absolute: true,
  })
  assert(files.includes(__filename))

  // globby
  const files2 = await globby(path.join(__dirname, './*.ts'), {
    dot: true,
    absolute: true,
  })
  assert(files2.includes(__filename))

  // cwd
  $.cwd = __dirname
  echo('ls: ')
  const has = (await $`ls`).stdout.includes('index.ts')
  assert(has)
}
