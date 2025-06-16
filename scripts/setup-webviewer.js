const fs = require('fs-extra');
const path = require('path');

async function copyWebViewerFiles() {
  try {
    const source = path.join(process.cwd(), 'node_modules/@pdftron/webviewer/public');
    const destination = path.join(process.cwd(), 'public/webviewer');

    // Ensure the destination directory exists
    await fs.ensureDir(destination);

    // Copy the files
    await fs.copy(source, destination);

    console.log('WebViewer files copied successfully!');
  } catch (err) {
    console.error('Error copying WebViewer files:', err);
    process.exit(1);
  }
}

copyWebViewerFiles(); 