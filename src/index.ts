import * as fs from "fs";
import { promisify } from "util";
import * as path from "path";

const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const stat = promisify(fs.stat);

async function walker(src: string, dest: string) {
  if ((await stat(src)).isDirectory()) {
    try {
      await mkdir(dest);
    } catch (
      // @ts-ignore
      error: NodeJS.ErrnoException
    ) {
      if (error.code !== "EEXIST") throw error;
    }
    const files = await readdir(src);
    await Promise.all(
      files.map((name) => {
        return walker(path.join(src, name), path.join(dest, name));
      })
    );
  } else await copyFile(src, dest);
}

export function dcopy(src: string, dest: string) {
  return walker(src, dest);
}
