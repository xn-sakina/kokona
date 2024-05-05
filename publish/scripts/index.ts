import path, { basename } from 'path'
import { parse } from 'rs-module-lexer'
import { execa } from 'execa'
import fs from 'fs-extra'
import { isEqual } from 'lodash'

interface IPkg {
  name: string
  version: string
  devDependencies: Record<string, string>
  dependencies: Record<string, string>
}

const run = async () => {
  const argv = process.argv.slice(2)
  const isSkipVersionCheck = argv.includes('--skip-version-check')

  const root = path.join(__dirname, '../../')
  const newRoot = path.join(__dirname, '../')

  const originPkgPath = path.join(root, './package.json')
  const originPackageJson = fs.readJsonSync(originPkgPath, 'utf-8') as IPkg

  const originSrc = path.join(root, './src')
  const newSrc = path.join(newRoot, './src')
  if (fs.existsSync(newSrc)) {
    fs.removeSync(newSrc)
  }
  fs.mkdirpSync(newSrc)
  // copy src
  fs.copySync(originSrc, newSrc)

  // override default verbose option
  const corePath = path.join(newSrc, './core.ts')
  const coreContent = fs.readFileSync(corePath, 'utf-8')
  const replaceContent = [`verbose: false,`, 'verbose: true,']
  const firstIdx = coreContent.indexOf(replaceContent[0])
  if (!~firstIdx) {
    throw new Error('missing verbose option')
  }
  const secondIdx = coreContent.indexOf(replaceContent[0], firstIdx + 1)
  if (~secondIdx) {
    throw new Error('duplicate verbose option')
  }
  const newCoreContent = coreContent.replace(
    replaceContent[0],
    replaceContent[1]
  )
  fs.writeFileSync(corePath, newCoreContent, 'utf-8')
  console.log('verbose option updated')

  // remove output
  const outputDir = path.join(newRoot, './build')
  if (fs.existsSync(outputDir)) {
    fs.removeSync(outputDir)
  }
  // build
  await execa('pnpm', ['build:tsc'], { cwd: newRoot })

  // extract all deps
  const files = fs
    .readdirSync(newSrc)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.join(newSrc, file))

  const result = await parse({
    input: files.map((i) => {
      return {
        filename: basename(i),
        code: fs.readFileSync(i, 'utf-8'),
      }
    }),
  })

  const deps = new Set<string>()
  result.output.forEach((o) => {
    o.imports.forEach((e) => {
      const name = e.n
      if (name?.length) {
        const isNodeDep = name.startsWith('node:')
        if (isNodeDep) {
          return
        }
        const isJsImport = name.endsWith('.js')
        if (isJsImport) {
          return
        }
        const isSubImport = !name.startsWith('@') && name.includes('/')
        if (isSubImport) {
          return
        }
        deps.add(name)
      }
    })
  })
  const depsArr = Array.from(deps)
  const depsMap: Record<string, string> = {}
  const devDependences = originPackageJson.devDependencies
  depsArr.forEach((dep) => {
    depsMap[dep] = devDependences[dep]
  })

  const newPkgPath = path.join(newRoot, './package.json')
  const newPackageJson = fs.readJsonSync(newPkgPath, 'utf-8') as IPkg
  const dependences = newPackageJson.dependencies
  // make sure includes all deps
  Object.entries(depsMap).forEach(([key, value]) => {
    if (!dependences?.[key]) {
      throw new Error(`missing dep: ${key}`)
    }
    if (dependences[key] !== value) {
      throw new Error(`dep version not match: ${key}`)
    }
    console.log(`dep: ${key} version: ${value}`)
  })

  // re install
  await execa('pnpm', ['install'], { cwd: newRoot, stdio: 'inherit' })

  // make sure field is correct
  const needCheckFields = [
    isSkipVersionCheck ? false : 'version',
    'type',
    'main',
    'types',
    'typesVersions',
    // 'exports',
    'bin',
    'license',
    'engines',
    'optionalDependencies',
  ].filter(Boolean) as string[]
  needCheckFields.forEach((field) => {
    if (!isEqual(originPackageJson[field], newPackageJson[field])) {
      throw new Error(`field not match: ${field}`)
    }
  })
  console.log('all fields are correct')

  // replace origin readme
  const originReadmePath = path.join(root, './README.md')
  const newReadmePath = path.join(newRoot, './README.md')
  fs.copySync(newReadmePath, originReadmePath)
}

run()
