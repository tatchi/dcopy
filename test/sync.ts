import { suite } from "uvu";
import { mkdir } from "mk-dirs";
import * as assert from "uvu/assert";
import { promisify } from "util";
import { dirname, join } from "path";
import { dcopy } from "../src/sync";
import tmp from "tmp";
import { premove } from "premove/sync";
import {
  existsSync,
  writeFile,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "fs";

const write = promisify(writeFile);

interface Context {
  tmpDir: string;
}

const test = suite<Context>("sync", {
  tmpDir: "",
});

test.before.each((context) => {
  try {
    const tmpDir = tmp.dirSync();

    context.tmpDir = tmpDir.name;
  } catch (error) {
    console.error(error);
  }
});
test.after.each(({ tmpDir }) => {
  try {
    premove(tmpDir);
  } catch (error) {
    console.error(error);
  }
});

async function touch(str: string, cwd: string = ".") {
  const dir = dirname(str);
  const joined = join(cwd || ".", dir);
  await mkdir(joined, { cwd }).then(() =>
    write(join(cwd || ".", str), "hello")
  );
  return str;
}

function stat(path: string) {
  return readdirSync(path).reduce(
    (acc, f) => {
      const isDirectory = statSync(join(path, f)).isDirectory();
      return isDirectory
        ? { ...acc, dirCount: acc.dirCount + 1 }
        : { ...acc, fileCount: acc.fileCount + 1 };
    },
    { fileCount: 0, dirCount: 0 }
  );
}

function exists(str: string, bool: boolean, msg?: string) {
  assert.is(existsSync(str), bool, msg);
}

test("exports", () => {
  assert.type(dcopy, "function");
});

test("copy single file", ({ tmpDir }) => {
  let src = join(tmpDir, "foo.txt");
  writeFileSync(src, "hello");

  exists(src, true, "~> foo.txt exists");

  const dst = join(tmpDir, "bar.txt");

  dcopy(src, dst);

  exists(dst, true, "~> copied file");
});

test("copy single empty directory", ({ tmpDir }) => {
  let src = join(tmpDir, "foo");
  mkdirSync(src);
  exists(src, true, "~> dir exists");

  const dst = join(tmpDir, "./bar");

  dcopy(src, dst);
  exists(dst, true, "~> copied dir");

  assert.is(statSync(dst).isDirectory(), true, "~> copied dir is a directory");

  const files = readdirSync(dst);

  assert.is(files.length, 0, "~> copied dir contains 0 file");
});

test("copy single directory with files", async ({ tmpDir }) => {
  await touch("bar/foo.txt", tmpDir);
  await touch("bar/baz.txt", tmpDir);
  const src = join(tmpDir, "bar");
  exists(src, true, "~> dir exists");
  exists(join(src, "foo.txt"), true, "~> foo.txt exists");
  exists(join(src, "baz.txt"), true, "~> baz.txt exists");

  const dst = join(tmpDir, "foo");

  dcopy(src, dst);

  exists(dst, true, "~> copied dir exist");
  assert.is(statSync(dst).isDirectory(), true, "~> copied dir is a directory");

  exists(join(dst, "foo.txt"), true, "~> copied file foo.txt exists");
  exists(join(dst, "baz.txt"), true, "~> copied file baz.txt exists");

  const files = readdirSync(dst);

  assert.is(files.length, 2, "~> copied dir contains 1 file");
});
test("copy directories recursively", async ({ tmpDir }) => {
  await touch("foo/bar/baz/bat/bat.txt", tmpDir);
  await touch("foo/bar/baz/bat/bat2.txt", tmpDir);
  await touch("foo/bar/baz/baz.txt", tmpDir);

  const bazDir = join(tmpDir, "foo/bar/baz");
  const batDir = join(tmpDir, "foo/bar/baz/bat");

  exists(bazDir, true, "~> baz dir exists");
  exists(batDir, true, "~> bat dir exists");
  exists(join(bazDir, "baz.txt"), true, "~> baz.txt exists");
  exists(join(batDir, "bat.txt"), true, "~> bat.txt exists");
  exists(join(batDir, "bat2.txt"), true, "~> bat2.txt exists");

  const dst = join(tmpDir, "foo_copy");

  dcopy(join(tmpDir, "foo"), dst);

  const copiedBazDir = join(tmpDir, "foo_copy/bar/baz");
  const copiedBatDir = join(tmpDir, "foo_copy/bar/baz/bat");

  exists(copiedBazDir, true, "~> copied baz dir dir exists");

  const { fileCount, dirCount } = stat(copiedBazDir);

  assert.is(fileCount, 1, "~> copied baz dir contains 1 file");
  assert.is(dirCount, 1, "~> copied baz dir contains 1 sub directory");

  exists(copiedBatDir, true, "~> copied bat dir exists");

  assert.is(
    readdirSync(copiedBatDir).length,
    2,
    "~> copied bat dir contains 1 file"
  );

  exists(join(copiedBazDir, "baz.txt"), true, "~> copied baz.txt exists");
  exists(join(copiedBatDir, "bat.txt"), true, "~> copied bat.txt exists");
  exists(join(copiedBatDir, "bat2.txt"), true, "~> copied bat2.txt exists");
});

test.run();
