const fs = require('fs');
const path = require('path');

const features = [
    'ActivityEditModal', 'ActivityGrid', 'ActivityPieChart', 'CategoryEditModal', 
    'DailyBarChart', 'GoalEditModal', 'PomodoroRuntime', 'PomodoroTimer', 
    'RecordEditModal', 'RecordsFilter', 'RecordsGroupByDate', 'ReminderEditModal', 
    'RunningTimerBar', 'TagEditModal', 'TagValueBreakdown'
];

const ui = [
    'ActivityCard', 'DateRangePicker', 'GoalCard', 'GoalProgressBadge', 
    'RecordItem', 'StatsSummaryCard', 'TimerControls'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Fix from pages and index.ts (../components/X -> ../components/features/X or ../components/ui/X)
    // Also from index.ts (./components/X -> ./components/features/X)
    
    // Replace in pages / store etc (starts with ../components/)
    features.forEach(feat => {
        const regex1 = new RegExp(`['"]\\.\\./components/${feat}['"]`, 'g');
        content = content.replace(regex1, `'../components/features/${feat}'`);
        
        const regex2 = new RegExp(`['"]\\./components/${feat}['"]`, 'g');
        content = content.replace(regex2, `'./components/features/${feat}'`);
        
        const regex3 = new RegExp(`['"]@/modules/tracker/components/${feat}['"]`, 'g');
        content = content.replace(regex3, `'@/modules/tracker/components/features/${feat}'`);
    });

    ui.forEach(u => {
        const regex1 = new RegExp(`['"]\\.\\./components/${u}['"]`, 'g');
        content = content.replace(regex1, `'../components/ui/${u}'`);
        
        const regex2 = new RegExp(`['"]\\./components/${u}['"]`, 'g');
        content = content.replace(regex2, `'./components/ui/${u}'`);
        
        const regex3 = new RegExp(`['"]@/modules/tracker/components/${u}['"]`, 'g');
        content = content.replace(regex3, `'@/modules/tracker/components/ui/${u}'`);
    });

    // 2. Fix inner references inside features/ and ui/
    // if a file is in features/ and imports from features/ => ./X
    // if a file is in features/ and imports from ui/ => ../ui/X
    // if a file is in features/ and imports from store/ => ../../store/X
    
    if (filePath.includes('components\\features') || filePath.includes('components/features')) {
        // fixes for moving down one level
        content = content.replace(/from '\.\.\/lib/g, "from '../../lib");
        content = content.replace(/from '\.\.\/store/g, "from '../../store");
        content = content.replace(/from '\.\.\/types/g, "from '../../types");
        
        features.forEach(feat => {
            const regex = new RegExp(`from '\\.\\/${feat}'`, 'g');
            content = content.replace(regex, `from './${feat}'`); // stays same
        });
        ui.forEach(u => {
            const regex = new RegExp(`from '\\.\\/${u}'`, 'g');
            content = content.replace(regex, `from '../ui/${u}'`);
        });
    }

    if (filePath.includes('components\\ui') || filePath.includes('components/ui')) {
        // fixes for moving down one level
        content = content.replace(/from '\.\.\/lib/g, "from '../../lib");
        content = content.replace(/from '\.\.\/store/g, "from '../../store");
        content = content.replace(/from '\.\.\/types/g, "from '../../types");
        
        ui.forEach(u => {
            const regex = new RegExp(`from '\\.\\/${u}'`, 'g');
            content = content.replace(regex, `from './${u}'`); // stays same
        });
        features.forEach(feat => {
            const regex = new RegExp(`from '\\.\\/${feat}'`, 'g');
            content = content.replace(regex, `from '../features/${feat}'`);
        });
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

const allFiles = [...walk('src/modules/tracker'), ...walk('src/app')];
allFiles.forEach(processFile);

console.log("Done");
