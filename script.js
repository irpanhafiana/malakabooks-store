const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src/app');
const keptFiles = ['bottom-sheet', 'drawer', 'editor', 'icon']; // We keep these base names

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const allFiles = walk(directory);
const cssFiles = allFiles.filter(f => f.endsWith('.css') && !f.endsWith('app.css'));

let deletedCount = 0;
let modifiedCount = 0;

cssFiles.forEach(cssPath => {
    const fileName = path.basename(cssPath, '.css'); // e.g. button.component
    const baseName = fileName.replace('.component', '');
    
    if (keptFiles.includes(baseName)) {
        console.log(`Skipping protected file: ${cssPath}`);
        return;
    }

    // Attempt to delete CSS
    try {
        fs.unlinkSync(cssPath);
        deletedCount++;
    } catch(e) {
        console.error(`Failed to delete ${cssPath}:`, e.message);
    }

    // Now find the corresponding .ts file and remove styleUrl
    const tsPath = cssPath.replace('.css', '.ts');
    if (fs.existsSync(tsPath)) {
        let content = fs.readFileSync(tsPath, 'utf8');
        // We want to remove `styleUrl: './<filename>.css',` or `styleUrls: [...]`
        // We'll use a regex to match the styleUrl line.
        // It might be `styleUrl: './button.component.css',` or without trailing comma
        const regex1 = new RegExp(`styleUrl\\s*:\\s*['"\`]./${fileName}\\.css['"\`]\\s*,?`, 'g');
        const regex2 = new RegExp(`styleUrls\\s*:\\s*\\[\\s*['"\`]./${fileName}\\.css['"\`]\\s*\\]\\s*,?`, 'g');
        
        let newContent = content.replace(regex1, '').replace(regex2, '');
        if (content !== newContent) {
            fs.writeFileSync(tsPath, newContent, 'utf8');
            modifiedCount++;
        }
    }
});

console.log(`Deleted ${deletedCount} CSS files.`);
console.log(`Modified ${modifiedCount} TS files.`);
