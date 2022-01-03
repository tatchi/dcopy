const esbuild = require("esbuild");
const ts = require("typescript");
const path = require("path");
const { readFileSync } = require("fs");
const { gzipSync } = require("zlib");

const entryPoints = [
  { entryPoint: "./src/index.ts", outdir: "dist" },
  { entryPoint: "./src/sync.ts", outdir: "sync" },
];

const build = (entryPoint, options = {}) => {
  const outExt = options.format === "esm" ? ".mjs" : ".js";

  return esbuild
    .build({
      entryPoints: [entryPoint],
      bundle: false,
      platform: "node",
      target: "node10",
      minify: false,
      external: [],
      // logLevel: "info",
      legalComments: "none",
      outExtension: { ".js": outExt },
      treeShaking: true,
      ...options,
    })
    .then(() => {
      const outfile = `${path.join(
        options.outdir,
        path.basename(entryPoint, ".ts")
      )}${outExt}`;
      return outfile;
    });
};

// https://github.com/lukeed/worktop/blob/e3a44ba8cd34d7fa6849f98d4fb8dae37afdb404/bin/format.js#L14
function toSize(val = 0) {
  const UNITS = ["B ", "kB", "MB", "GB"];
  if (val < 1e3) return `${val} ${UNITS[0]}`;
  let exp = Math.min(Math.floor(Math.log10(val) / 3), UNITS.length - 1) || 1;
  let out = (val / Math.pow(1e3, exp)).toPrecision(3);
  let idx = out.indexOf(".");
  if (idx === -1) {
    out += ".00";
  } else if (out.length - idx - 1 !== 2) {
    out = (out + "00").substring(0, idx + 3); // 2 + 1 for 0-based
  }
  return out + " " + UNITS[exp];
}

Promise.all([
  build("./src/index.ts", { outdir: "dist", format: "esm" }),
  build("./src/index.ts", { outdir: "dist", format: "cjs" }),
  build("./src/sync.ts", { outdir: "sync", format: "esm" }),
  build("./src/sync.ts", { outdir: "sync", format: "cjs" }),
]).then((outfiles) => {
  const _ = " ";
  const rpad = (str, max) => str + _.repeat(max - str.length);
  let maxLength = 0;
  outfiles.forEach((file) => {
    maxLength = Math.max(maxLength, file.length);
  });
  return outfiles.map((outfile) => {
    const data = readFileSync(outfile);
    const size = toSize(gzipSync(data).byteLength);
    console.log(`${rpad(outfile, maxLength)}    ${size}`);
  });
});

entryPoints.forEach(({ entryPoint, outdir }) =>
  generateDtsForFile(entryPoint, outdir)
);

// https://github.com/rsms/estrella/blob/master/examples/typedef-generation/build.js
function generateDtsForFile(file, outDir) {
  const tsconfig = ts.readConfigFile("./tsconfig.json", ts.sys.readFile).config;

  const compilerOptions = {
    ...tsconfig.compilerOptions,
    moduleResolution: undefined,
    declaration: true,
    outDir,
  };

  const files = Array.from(new Set(Array.isArray(file) ? file : [file]));

  const program = ts.createProgram(files, compilerOptions);
  const targetSourceFile = undefined;
  const writeFile = undefined;
  const cancellationToken = undefined;
  const emitOnlyDtsFiles = true;

  program.emit(
    targetSourceFile,
    writeFile,
    cancellationToken,
    emitOnlyDtsFiles
  );
}
