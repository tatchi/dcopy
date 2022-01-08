import * as fs from "fs";
import * as path from "path";

function walker(src: string, dest: string) {
  let stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((name) => {
      walker(path.join(src, name), path.join(dest, name));
    });
  } else fs.copyFileSync(src, dest);
}

export function dcopy(src: string, dest: string) {
  walker(src, dest);
}
