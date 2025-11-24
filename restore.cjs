#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const WINDOW_FILE = path.join(process.env.HOME, '.window-positions.json');

if (!fs.existsSync(WINDOW_FILE)) {
    console.log('❌ No saved window positions found. Run "npm run save" first.');
    process.exit(1);
}

console.log(`🔄 Restoring window positions from ${WINDOW_FILE}...`);

const config = JSON.parse(fs.readFileSync(WINDOW_FILE, 'utf8'));
console.log(`📍 Found ${config.windows.length} windows to restore...`);

let restored = 0;
let failed = 0;

// Group windows by app
const appGroups = {};
for (const window of config.windows) {
    if (!appGroups[window.app]) {
        appGroups[window.app] = [];
    }
    appGroups[window.app].push(window);
}

async function restoreWindows() {
    for (const [appName, windows] of Object.entries(appGroups)) {
        console.log(`\n🔧 Processing ${appName} (${windows.length} windows)...`);

        for (let i = 0; i < windows.length; i++) {
            const window = windows[i];

            // Skip invalid windows
            if (window.width <= 0 || window.height <= 0) {
                console.log(`⚠️  Skipping invalid window: ${appName}`);
                continue;
            }

            let script;
            if ((appName === 'Google Chrome' || appName === 'Code' || appName === 'Visual Studio Code' || appName === 'Finder' || appName === 'Terminal') && window.title && window.title.trim() !== '') {
                // Enhanced handling with title matching for apps that commonly have multiple windows
                let searchTerm;
                if (appName === 'Google Chrome') {
                    searchTerm = window.title.split(' - ')[0].replace(/"/g, '\\"');
                } else if (appName === 'Code' || appName === 'Visual Studio Code') {
                    // For VS Code, use the file/folder name part
                    searchTerm = window.title.split(' - ')[0].replace(/"/g, '\\"');
                } else {
                    // For other apps, use the full title
                    searchTerm = window.title.replace(/"/g, '\\"');
                }

                script = `tell application "System Events"
    try
        tell application process "${appName.replace(/"/g, '\\"')}"
            set theWindows to (every window whose subrole is "AXStandardWindow")
            set targetWindow to missing value

            -- Try to find window by title (look for matching content)
            set searchTerm to "${searchTerm}"
            repeat with w in theWindows
                if (title of w) contains searchTerm then
                    set targetWindow to w
                    exit repeat
                end if
            end repeat

            -- If no match found, use the window at the specified index
            if targetWindow is missing value and (count of theWindows) > ${i} then
                set targetWindow to item ${i + 1} of theWindows
            end if

            if targetWindow is not missing value then
                -- Check if window is minimized and unminimize if needed
                try
                    if value of attribute "AXMinimized" of targetWindow is true then
                        set value of attribute "AXMinimized" of targetWindow to false
                        delay 0.2
                    end if
                end try

                set position of targetWindow to {${window.x}, ${window.y}}
                set size of targetWindow to {${window.width}, ${window.height}}
                return "success"
            else
                return "no matching window"
            end if
        end tell
    on error errMsg
        return "error: " & errMsg
    end try
end tell`;
            } else {
                // Standard handling for other apps
                const appNameEscaped = appName.replace(/"/g, '\\"');
                script = `tell application "System Events"
    try
        tell application process "${appNameEscaped}"
            set theWindows to (every window whose subrole is "AXStandardWindow")
            if (count of theWindows) > ${i} then
                set targetWindow to item ${i + 1} of theWindows

                -- Check if window is minimized and unminimize if needed
                try
                    if value of attribute "AXMinimized" of targetWindow is true then
                        set value of attribute "AXMinimized" of targetWindow to false
                        delay 0.2
                    end if
                end try

                set position of targetWindow to {${window.x}, ${window.y}}
                set size of targetWindow to {${window.width}, ${window.height}}
                return "success"
            else
                return "no window"
            end if
        end tell
    on error errMsg
        return "error: " & errMsg
    end try
end tell`;
            }

            try {
                const result = execSync(`osascript -e '${script.replace(/'/g, "\"")}'`, {
                    encoding: 'utf8',
                    timeout: 10000
                });

                if (result.includes('success')) {
                    restored++;
                    console.log(`  ✅ Window ${i + 1}: ${window.x},${window.y} ${window.width}x${window.height}`);
                } else {
                    failed++;
                    console.log(`  ❌ Window ${i + 1}: ${result.trim()}`);
                }
            } catch (error) {
                failed++;
                console.log(`  ❌ Window ${i + 1}: Error`);
            }

            // Small delay between windows
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log('\n📊 Restoration complete!');
    console.log(`   ✅ ${restored} windows restored`);
    console.log(`   ❌ ${failed} windows failed`);
    console.log('🎉 Your window layout has been restored across your monitors!');
    console.log('✨ Done!');
}

restoreWindows().catch(console.error);