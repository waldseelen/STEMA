const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Inside time-tracking/queries: ../../types -> ../types
    if (filePath.includes('time-tracking\\queries') || filePath.includes('time-tracking/queries')) {
        content = content.replace(/from '\.\.\/\.\.\/types'/g, "from '../types'");
    }

    // Replace '@/db/types' with '@/db/time-tracking/types'
    content = content.replace(/from '@\/db\/types'/g, "from '@/db/time-tracking/types'");

    // Replace '@/db' with '@/db/time-tracking' (careful not to replace '@/db/planner' if exists, though planners usually use relative or specific)
    // Actually we only saw '@/db' in settingsStore.ts
    if (filePath.includes('settingsStore.ts')) {
        content = content.replace(/from '@\/db'/g, "from '@/db/time-tracking'");
    }

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = [...walk('src/'), ...walk('src/db/time-tracking/queries')];
allFiles.forEach(processFile);

console.log("Done");
