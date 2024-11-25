const sass = require("sass");
const fs = require("fs");
const path = require("path");

async function compileScss() {
  try {
    console.log(`*** Start compiling scss files`);
    const nodeModulePath = path.join(__dirname.replace("/runner", ""));
    const compileCSSDirPath = path.join(__dirname, "dist/digital-form-builder-adapter/runner/public/build/stylesheets");
    const scssDirPath = path.join(__dirname, "src/client/sass");
    console.log(`*** Main Directory path [${__dirname}]`);
    console.log("*** node_modules path [" + nodeModulePath + "/node_modules" + "]");
    console.log(`*** Compiled css path [${compileCSSDirPath}]`);

    if (!fs.existsSync(compileCSSDirPath)) {
      try {
        fs.mkdirSync(compileCSSDirPath, { recursive: true });
        console.log(`*** Compile Directory created ${compileCSSDirPath}`);
      } catch (err) {
        console.error("*** Error creating the compile dir", err);
        return;
      }
    }

    fs.readdir(scssDirPath, (err, files) => {
      if (err) {
        console.error("Error reading the dir", err);
        return;
      }

      const scssFiles = files.filter(file => path.extname(file) === ".scss");
      console.log(`*** Selected scss files [${scssFiles}]`);

      scssFiles.forEach(file => {

        const scssFilePath = path.join(scssDirPath, file);
        console.log(`*** Compiling [${scssFilePath}] into css`);

        const result = sass.compile(scssFilePath, {
          loadPaths: [path.join(nodeModulePath, "node_modules")]
        });

        const compiledFilePath = path.join(compileCSSDirPath, path.parse(file).name+'.css');
        console.log(`*** Compiled file path [${compiledFilePath}] into css`);

        fs.writeFile(compiledFilePath, result.css, (err) => {
          if (err) {
            console.error("Error compiling Sass:", err);
          } else {
            console.log("Sass compiled successfully.");
          }
        });

      });
    });


  } catch (error) {
    console.error("Error compiling Sass:", error);
  }
}

compileScss();
