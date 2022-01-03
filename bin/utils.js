const { readFileSync } = require("fs");
const { rewrite: rimports } = require("rewrite-imports");
const { gzipSync } = require("zlib");
const ts = require("typescript");
const { cyan, dim, gray, blue } = require("kleur");

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

exports.toRequire = function (input) {
  let footer = "";
  let content = readFileSync(input, "utf8");

  return rimports(content)
    .replace(/(^|\s|;)export default/, "$1module.exports =")
    .replace(
      /(^|\s|;)export (const|(?:async )?function|class|let|var) (.+?)(?=(\(|\s|\=))/gi,
      (_, x, type, name) => {
        footer += `\nexports.${name} = ${name};`;
        return `${x}${type} ${name}`;
      }
    )
    .replace(
      /(^|\s|\n|;?)export \{([\s\S]*?)\};?([\n\s]*?|$)/g,
      (_, x, names) => {
        names.split(",").forEach((name) => {
          let [src, dest] = name.trim().split(/\s+as\s+/);
          footer += `\nexports.${dest || src} = ${src};`;
        });
        return x;
      }
    )
    .concat(footer);
};

const _ = " ";
const lpad = (str, max) => _.repeat(max - str.length) + str;
const rpad = (str, max) => str + _.repeat(max - str.length);
const th = dim().bold().italic().underline;

exports.table = function (files) {
  let f = 8,
    s = 8,
    g = 6;
  let out = "",
    data,
    tmp;
  let G1 = _ + _,
    G2 = G1 + G1;

  let arr = files.sort().map((fname) => {
    data = readFileSync(fname);

    tmp = {
      file: fname,
      size: toSize(data.byteLength),
      gzip: toSize(gzipSync(data).byteLength),
    };

    f = Math.max(f, tmp.file.length);
    s = Math.max(s, tmp.size.length);
    g = Math.max(g, tmp.gzip.length);

    return tmp;
  });

  f += 2; // underline extension

  out +=
    G1 +
    th(rpad("Filename", f)) +
    G2 +
    th(lpad("Filesize", s)) +
    G1 +
    dim().bold().italic(lpad("(gzip)", g));

  arr.forEach((obj, idx) => {
    if (idx && idx % 2 === 0) out += "\n";
    out +=
      "\n" +
      G1 +
      gray(rpad(obj.file, f)) +
      G2 +
      cyan(lpad(obj.size, s)) +
      G1 +
      blue().italic(lpad(obj.gzip, g));
  });

  console.log("\n" + out + "\n");
};

// https://github.com/rsms/estrella/blob/master/examples/typedef-generation/build.js
exports.generateDtsForFile = function (file, outDir) {
  const tsconfig = ts.readConfigFile("../tsconfig.json", ts.sys.readFile).config;

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
};
