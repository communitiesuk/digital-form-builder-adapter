const fs = require('fs');
const path = require('path');

// Function to copy JSON files from source to destination
function copyJsonFiles(sourceDir, destDir) {
  // Ensure the destination directory exists, if not create it
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, {recursive: true});
  }
  // Read all files and directories in the source directory
  const items = fs.readdirSync(sourceDir);
  items.forEach(item => {
    const itemPath = path.join(sourceDir, item);
    const itemStat = fs.statSync(itemPath);
    if (itemStat.isDirectory()) {
      // If the item is a directory, recursively copy JSON files within it
      copyJsonFiles(itemPath, destDir);
    } else if (itemStat.isFile() && path.extname(item) === '.json') {
      // If the item is a JSON file, copy it to the destination directory
      const destPath = path.join(destDir, item);
      fs.copyFileSync(itemPath, destPath);
      console.log(`Copied: ${itemPath} -> ${destPath}`);
    }
  });
}

// Usage
const sourceDir = path.join(__dirname, '..' , 'fsd_config', 'form_jsons'); // Source directory
const destDir = path.join(__dirname, 'dist', 'digital-form-builder-adapter', 'runner', 'server', 'forms'); // Destination directory
copyJsonFiles(sourceDir, destDir);
