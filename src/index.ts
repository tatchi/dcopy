import * as fs from "fs/promises";
import * as path from "path";

async function walker(src: string, dest: string, mode: number | undefined) {
  let stats = await fs.stat(src);
  if (stats.isDirectory()) {
    await fs.mkdir(dest);
    const files = await fs.readdir(src);
    await Promise.all(
      files.map((name) => {
        return walker(path.join(src, name), path.join(dest, name), mode);
      })
    );
  } else await fs.copyFile(src, dest, mode);
}

export function dcopy(src: string, dest: string, mode?: number | undefined) {
  return walker(src, dest, mode);
}
