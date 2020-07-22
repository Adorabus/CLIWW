console.log('Compiling and packaging for release...')

const path = require('path')
const {execSync} = require('child_process')
const Zip = require('adm-zip')
const commandExistsSync  = require('command-exists').sync
const {version} = require('./package.json')

const cldir = path.join(__dirname, 'client')
const svdir = path.join(__dirname, 'server')

if (commandExistsSync('tsc')) {
  console.log('TypeScript found.')
} else {
  console.log('TypeScript is required. Please install it and try again.')
  process.exit(0)
}

console.log('Building client...')
process.chdir(cldir)
execSync('npm run build', {stdio: 'inherit'})

console.log('Building server...')
process.chdir(svdir)
execSync('tsc', {stdio: 'inherit'})


console.log('Packaging...')
process.chdir(__dirname)

const output = new Zip()
const outputName = `cliww-v${version}.zip`

output.addLocalFolder(path.join(svdir, 'dist'), 'cliww/dist')
output.addLocalFolder(path.join(svdir, 'bin'), 'cliww/bin')
output.addLocalFolder(path.join(cldir, 'dist'), 'cliww/dist/public')
output.addLocalFile(path.join(svdir, 'package.json'), 'cliww/')
output.addLocalFile(path.join(svdir, 'package-lock.json'), 'cliww/')
output.addLocalFile(path.join(__dirname, 'README.md'), 'cliww/')
output.writeZip(outputName)

console.log()
console.log(`Wrote to ${outputName}.  All done!`)
