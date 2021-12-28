import { suite } from "uvu";
import { mkdir } from "mk-dirs";
import * as assert from "uvu/assert";
import { promisify } from "util";
import { dirname, join } from "path";
import { dcopy } from "../src/sync";
import tmp from "tmp";
import {
  existsSync,
  writeFile,
  rmdirSync,
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
    rmdirSync(tmpDir, { recursive: true });
  } catch (error) {
    console.error(error);
  }
});

async function touch(str: string, cwd?: string) {
  const dir = dirname(str);
  const joined = join(cwd || ".", dir);
  await mkdir(joined, { cwd }).then(() =>
    write(join(cwd || ".", str), "hello")
  );
  return str;
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
  const src = join(tmpDir, "bar");
  exists(src, true, "~> dir exists");

  const dst = join(tmpDir, "foo");

  dcopy(src, dst);

  exists(dst, true, "~> copied dir exist");
  assert.is(statSync(dst).isDirectory(), true, "~> copied dir is a directory");

  exists(join(dst, "foo.txt"), true, "~> copied file exist");

  const files = readdirSync(dst);

  assert.is(files.length, 1, "~> copied dir contains 1 file");
});

test.run();
