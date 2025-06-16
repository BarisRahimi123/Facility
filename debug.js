const fs = require('fs');
const path = require('path');

// Check if Next.js dependencies exist
function checkNextDependencies() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('Package.json found. Checking dependencies...');
    
    // Check if Next.js is in dependencies
    const hasNextDep = packageJson.dependencies && packageJson.dependencies.next;
    console.log(`Next.js in dependencies: ${hasNextDep ? 'Yes' : 'No'}`);
    if (hasNextDep) {
      console.log(`Next.js version: ${packageJson.dependencies.next}`);
    }
    
    // Check node_modules
    const nextModulePath = path.join(process.cwd(), 'node_modules', 'next');
    const nextBinPath = path.join(process.cwd(), 'node_modules', '.bin', 'next');
    
    console.log(`Next.js module exists: ${fs.existsSync(nextModulePath) ? 'Yes' : 'No'}`);
    console.log(`Next.js bin exists: ${fs.existsSync(nextBinPath) ? 'Yes' : 'No'}`);
    
    // Check app directory structure
    const appDirectory = path.join(process.cwd(), 'src', 'app');
    const pagesDirectory = path.join(process.cwd(), 'src', 'pages');
    
    console.log(`App directory exists: ${fs.existsSync(appDirectory) ? 'Yes' : 'No'}`);
    console.log(`Pages directory exists: ${fs.existsSync(pagesDirectory) ? 'Yes' : 'No'}`);
    
    // List route directories in app
    if (fs.existsSync(appDirectory)) {
      console.log('\nRoutes in App directory:');
      const appDirs = fs.readdirSync(appDirectory);
      appDirs.forEach(dir => {
        const stat = fs.statSync(path.join(appDirectory, dir));
        if (stat.isDirectory()) {
          console.log(`- ${dir}`);
        } else if (dir.endsWith('.tsx') || dir.endsWith('.jsx') || dir.endsWith('.js')) {
          console.log(`- ${dir} (file)`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking dependencies:', error);
  }
}

// Check for environment issues
function checkEnvironment() {
  console.log('\nEnvironment Information:');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Current directory: ${process.cwd()}`);
  
  // Check .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  console.log(`.env.local exists: ${fs.existsSync(envPath) ? 'Yes' : 'No'}`);
  
  // Check next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  console.log(`next.config.js exists: ${fs.existsSync(nextConfigPath) ? 'Yes' : 'No'}`);
}

console.log('=== Next.js Project Debug ===\n');
checkNextDependencies();
checkEnvironment();
console.log('\n=== Debug Complete ==='); 