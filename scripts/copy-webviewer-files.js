const fs = require('fs-extra');
const path = require('path');

const source = path.join(process.cwd(), 'node_modules/@pdftron/webviewer/public');
const destination = path.join(process.cwd(), 'public/webviewer');

// Remove the destination directory if it exists
if (fs.existsSync(destination)) {
  fs.removeSync(destination);
}

// Copy the files
fs.copySync(source, destination);

console.log('WebViewer files copied successfully!'); 