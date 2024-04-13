import { which, $ } from '../build'

export const run = async () => {
  const res = await which('brew')
  await $`echo ${res}`
}
