import * as fs from "fs";
import { promisify } from "util";
import * as path from "path";

const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const stat = promisify(fs.stat);

async function walker(src: string, dest: string, mode: number | undefined) {
  let stats = await stat(src);
  if (stats.isDirectory()) {
    await mkdir(dest);
    const files = await readdir(src);
    await Promise.all(
      files.map((name) => {
        return walker(path.join(src, name), path.join(dest, name), mode);
      })
    );
  } else await copyFile(src, dest, mode);
}

export function dcopy(src: string, dest: string, mode?: number | undefined) {
  return walker(src, dest, mode);
}
