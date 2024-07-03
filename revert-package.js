const fs = require('fs');
const packagePath = 'digital-form-builder/runner/package.json';
// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
// Modify package.json
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  '@xgovformbuilder/model': 'workspace:model',
  '@xgovformbuilder/queue-model': 'workspace:queue-model'
};
// Write package.json back to file
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('package.json updated successfully');
