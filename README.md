# dcopy [![Build and test](https://github.com/tatchi/dcopy/actions/workflows/ci.yml/badge.svg)](https://github.com/tatchi/dcopy/actions/workflows/ci.yml)

> A tiny (241B to 339B) utility to copy items recursively

This is a `Promise`-based, cross-platform utility that recursively copy files and directories.

> **Notice:** Node v16.7.0 added an experimental [`fs.cp`](https://nodejs.org/docs/latest-v16.x/api/fs.html#fscpsrc-dest-options-callback) and [`fs.cpSync`](https://nodejs.org/docs/latest-v16.x/api/fs.html#fscpsyncsrc-dest-options).

## Install

```
$ npm install --save @tatchi/dcopy
```

## Modes

There are two "versions" of `dcopy` available:

#### "async"

> **Size (gzip):** 340 bytes<br> > **Availability:** [CommonJS](https://unpkg.com/@tatchi/dcopy/dist/index.js), [ES Module](https://unpkg.com/@tatchi/dcopy/dist/index.mjs)

This is the primary/default mode. It makes use of `async`/`await` and [`util.promisify`](https://nodejs.org/api/util.html#util_util_promisify_original).

#### "sync"

> **Size (gzip):** 241 bytes<br> > **Availability:** [CommonJS](https://unpkg.com/@tatchi/dcopy/sync/index.js), [ES Module](https://unpkg.com/@tatchi/dcopy/sync/index.mjs)

This is the opt-in mode, ideal for scenarios where `async` usage cannot be supported.<br>In order to use it, simply make the following changes:

```diff
-import { dcopy } from 'dcopy';
+import { dcopy } from 'dcopy/sync';
```

## Usage

```ts
import { dcopy } from "dcopy";

// Async/await
try {
  await dcopy("./foobar", "./foobar_copy");
} catch (err) {
  //
}

// Promise
dcopy("./foobar", "./foobar_copy")
  .then(() => {
    //
  })
  .catch((err) => {
    //
  });

// Sync
import { dcopy } from "dcopy/sync";
dcopy("./foobar", "./foobar_copy");
```

## API

### dcopy(srcPath, dstPath)

Returns: `Promise<void>`

Returns a Promise that resolves when all the files/folders have been copied to the destination.

> **Important:**<br>The `sync` and `async` versions share the same API.<br>The **only** difference is that `sync` is not Promise-based.

#### srcPath

Type: `String`

The filepath to copy from – may be a file or a directory.

#### dstPath

Type: `String`<br>

The filepath to copy to.

## Acknowledgments

This library is heavily inspired from and reuses lots of [lukeed](https://github.com/lukeed)'s work.
