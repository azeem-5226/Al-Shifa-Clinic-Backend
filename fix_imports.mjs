import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const targetDir = process.argv[2] || './src_js';
const files = walk(targetDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Regex to match imports starting with . or .. that don't end with .js
    content = content.replace(/(import\s+.*?from\s+['"]\.[^'"]*)(['"])/g, (match, p1, p2) => {
        if (!p1.endsWith('.js')) {
            return `${p1}.js${p2}`;
        }
        return match;
    });
    fs.writeFileSync(file, content);
});
console.log('Fixed extensions in src_js');
