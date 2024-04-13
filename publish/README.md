# kokona

This is a fork version of [`zx`](https://github.com/google/zx), it used for TypeScript runtime.

### Motivation

We often use [`tsx`](https://github.com/esbuild-kit/tsx) to execute `.ts` scripts instead of `.js` scripts. however, `zx` v8 bundles everything, and top-level await doesn't work in CJS module scripts. this package solves this issue.

### Example

```bash
  pnpm i -D kokona
```

```ts
// script.ts

import 'kokona/global'

const run = async () => {
  await $`echo "Hello, World!"`
}

run()
```

```bash
  pnpm tsx script.ts
```

