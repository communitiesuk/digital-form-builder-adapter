const fs = require('fs');
const packagePath = 'digital-form-builder/runner/package.json';
const packageModelPath = 'digital-form-builder/model/package.json';
const packageQueueModelPath = 'digital-form-builder/queue-model/package.json';
// Read package.json
const packageRunnerJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageJsonModel = JSON.parse(fs.readFileSync(packageModelPath, 'utf8'));
const packageJsonQueueModel = JSON.parse(fs.readFileSync(packageQueueModelPath, 'utf8'));
// Modify package.json
packageRunnerJson.devDependencies = {
  ...packageRunnerJson.devDependencies,
  '@xgovformbuilder/model': packageJsonModel.version,
  '@xgovformbuilder/queue-model': packageJsonQueueModel.version
};

packageRunnerJson.installConfig = {}

// Write package.json back to file
fs.writeFileSync(packagePath, JSON.stringify(packageRunnerJson, null, 2));
console.log('runner package.json updated successfully model:['
  +packageJsonModel.version+'] queue-model:['+packageJsonQueueModel.version+"]");
