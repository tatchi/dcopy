const esbuild = require("esbuild");
const ts = require("typescript");

const files = [
  { entryPoint: "./src/index.ts", outdir: "dist" },
  { entryPoint: "./src/sync/index.ts", outdir: "sync" },
];

files.forEach(({ entryPoint, outdir }) => {
  esbuild.build({
    entryPoints: [entryPoint],
    bundle: false,
    platform: "node",
    format: "esm",
    bundle: false,
    outExtension: { ".js": ".mjs" },
    outdir,
  });

  esbuild.build({
    entryPoints: [entryPoint],
    bundle: false,
    platform: "node",
    format: "cjs",
    outdir,
  });

  generateDtsForFile(entryPoint, outdir);
});

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

  // const { fileNames, errors } = ts.parseJsonConfigFileContent(
  //   config,
  //   ts.sys,
  //   "src"
  // );

  // console.log(fileNames)

  // if (errors.length) {
  //   const formatHost = {
  //     getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  //     getNewLine: () => ts.sys.newLine,
  //     getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
  //       ? (f) => f
  //       : (f) => f.toLowerCase(),
  //   };
  //   console.error(ts.formatDiagnostics(errors, formatHost));
  // }

  // const host = ts.createCompilerHost(config);
}
