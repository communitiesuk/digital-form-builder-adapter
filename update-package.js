const fs = require('fs');
const packagePath = 'digital-form-builder/runner/package.json';
const packageRunnerPath = 'runner/package.json';
const packageModelPath = 'digital-form-builder/model/package.json';
const packageQueueModelPath = 'digital-form-builder/queue-model/package.json';
const packageAdapterPath = 'package.json';
const packageBuilderPath = 'digital-form-builder/package.json';
// Read package.json
const packageRunnerJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageAdapterRunnerJson = JSON.parse(fs.readFileSync(packageRunnerPath, 'utf8'));
const packageJsonModel = JSON.parse(fs.readFileSync(packageModelPath, 'utf8'));
const packageJsonQueueModel = JSON.parse(fs.readFileSync(packageQueueModelPath, 'utf8'));
const packageAdapterJson = JSON.parse(fs.readFileSync(packageAdapterPath, 'utf8'));
const packageBuilderJson = JSON.parse(fs.readFileSync(packageBuilderPath, 'utf8'));
// Modify package.json
packageRunnerJson.devDependencies = {
  ...packageRunnerJson.devDependencies,
  '@xgovformbuilder/model': packageJsonModel.version,
  '@xgovformbuilder/queue-model': packageJsonQueueModel.version,
  'joi': packageAdapterRunnerJson.dependencies.joi
};

packageJsonModel.dependencies = {
  ...packageJsonModel.dependencies,
  'joi': packageAdapterRunnerJson.dependencies.joi
};

// CVE-2026-26996, CVE-2026-27903 and CVE-2026-27904 are ReDoS flaws fixed in
// every minimatch release line. A single blanket resolution is not an option
// because minimatch 9 dropped the callable CommonJS export, which eslint,
// glob@7, nodemon, jake and test-exclude all rely on, so each requested range
// is pinned to the patched release of its own major instead
const minimatchResolutions = Object.fromEntries(
  Object.entries(packageAdapterJson.resolutions)
    .filter(([name]) => name.startsWith('minimatch@'))
);

// The submodule is installed as its own yarn project, so the adapter's CVE
// resolutions do not reach it and have to be copied over
packageBuilderJson.resolutions = {
  ...packageBuilderJson.resolutions,
  ...minimatchResolutions,
  'tar': packageAdapterJson.resolutions.tar,
  'shell-quote': packageAdapterJson.resolutions['shell-quote'],
  'cipher-base': packageAdapterJson.resolutions['cipher-base'],
  'loader-utils': packageAdapterJson.resolutions['loader-utils'],
  'handlebars': packageAdapterJson.resolutions['handlebars'],
  'cypress': packageAdapterJson.resolutions.cypress,
  'immutable': packageAdapterJson.resolutions.immutable,
  // CVE-2025-13204: upstream expr-eval has no patched release, so alias it to
  // the maintained fork that carries the prototype pollution fix
  'expr-eval': packageAdapterJson.resolutions['expr-eval'],
  // Only reaches the image as a transitive dep of webpack-dev-server, which
  // nothing invokes (no devServer config, no script runs it) but which still
  // gets installed into the designer image and scanned. v7 wants webpack 5
  // while the designer is on webpack 4; it declares that peer optional, so the
  // override installs cleanly and the middleware is never loaded either way
  'webpack-dev-middleware': packageAdapterJson.resolutions['webpack-dev-middleware']
};

packageRunnerJson.installConfig = {}

// Write package.json back to file
fs.writeFileSync(packagePath, JSON.stringify(packageRunnerJson, null, 2));
console.log('runner package.json updated successfully model:['
  + packageJsonModel.version + '] queue-model:[' + packageJsonQueueModel.version + "]");


// Write package.json back to file
fs.writeFileSync(packageModelPath, JSON.stringify(packageJsonModel, null, 2));
console.log('model package.json updated successfully joi:[' +  packageAdapterRunnerJson.dependencies.joi + ']');

// Write package.json back to file
fs.writeFileSync(packageBuilderPath, JSON.stringify(packageBuilderJson, null, 2));
console.log('digital-form-builder package.json updated successfully tar:[' + packageAdapterJson.resolutions.tar
  + '] shell-quote:[' + packageAdapterJson.resolutions['shell-quote']
  + '] cipher-base:[' + packageAdapterJson.resolutions['cipher-base']
  + '] loader-utils:[' + packageAdapterJson.resolutions['loader-utils']
  + '] handlebars:[' + packageAdapterJson.resolutions['handlebars']
  + '] cypress:[' + packageAdapterJson.resolutions.cypress
  + '] immutable:[' + packageAdapterJson.resolutions.immutable
  + '] expr-eval:[' + packageAdapterJson.resolutions['expr-eval']
  + '] webpack-dev-middleware:[' + packageAdapterJson.resolutions['webpack-dev-middleware']
  + '] minimatch:[' + Object.entries(minimatchResolutions)
    .map(([range, version]) => range + '=>' + version).join(' ') + ']');
