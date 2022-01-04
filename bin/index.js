const esbuild = require("esbuild");
const path = require("path");
const { writeFileSync, existsSync, copyFileSync } = require("fs");
const pkg = require("../package.json");
const { toRequire, table, generateDtsFiles } = require("./utils");

/**
 * @type {string[]}
 */
const FILELIST = [];

/**
 *
 * @param {string} file
 * @returns {string}
 */
function save(file) {
  file = path.normalize(file);
  return FILELIST.push(file) && file;
}

/**
 *
 * @param {string} input
 * @param {Record<'import'|'require', string>} files
 */
async function bundle(input, files) {
  const outfile = save(files.import);

  await esbuild.build({
    bundle: false,
    platform: "node",
    target: "node10",
    format: "esm",
    outfile,
    entryPoints: [input],
    outExtension: { ".js": ".mjs" },
  });

  writeFileSync(save(files.require), toRequire(outfile));

  let dts = input.replace(/\.[mc]?[tj]s$/, ".d.ts");
  if (!existsSync(dts))
    return console.warn('Missing "%s" file!', dts), (process.exitCode = 1);

  copyFileSync(dts, save(files.types));
}

generateDtsFiles();

Promise.all([
  bundle("./src/index.ts", pkg.exports["."]),
  bundle("./src/sync.ts", pkg.exports["./sync"]),
]).then(() => table(FILELIST));
