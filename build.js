const esbuild = require("esbuild");
const ts = require("typescript");
const path = require("path");
const gzipSize = require("gzip-size");

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
  return outfiles.map((outfile) =>
    gzipSize.file(outfile).then((size) => {
      console.log(`${rpad(outfile, maxLength)}    ${size} B`);
    })
  );
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
