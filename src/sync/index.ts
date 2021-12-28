import * as fs from "fs";
import * as path from "path";

function walker(src: string, dest: string, mode: number | undefined) {
  let stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((name) => {
      walker(path.join(src, name), path.join(dest, name), mode);
    });
  } else fs.copyFileSync(src, dest, mode);
}

export function dcopy(src: string, dest: string, mode?: number | undefined) {
  walker(src, dest, mode);
}
