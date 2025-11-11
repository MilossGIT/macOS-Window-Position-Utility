#!/bin/bash

# Simple window restore script
# This script reads the saved window positions and restores them using AppleScript

WINDOW_FILE="$HOME/.window-positions.json"

if [ ! -f "$WINDOW_FILE" ]; then
    echo "❌ No saved window positions found. Run 'npm run save' first."
    exit 1
fi

echo "🔄 Restoring window positions from $WINDOW_FILE..."

# Use Node.js to parse JSON and generate AppleScript commands
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync('$WINDOW_FILE', 'utf8'));
console.log(\`📍 Found \${config.windows.length} windows to restore...\`);

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

for (const [appName, windows] of Object.entries(appGroups)) {
    console.log(\`\\n🔧 Processing \${appName} (\${windows.length} windows)...\`);

    for (let i = 0; i < windows.length; i++) {
        const window = windows[i];

        // Skip invalid windows
        if (window.width <= 0 || window.height <= 0) {
            console.log(\`⚠️  Skipping invalid window: \${appName}\`);
            continue;
        }

        const script = \`
tell application \"System Events\"
    try
        tell application process \"\${appName.replace(/\"/g, '\\\\\\\\')}\"
            set theWindows to (every window whose subrole is \"AXStandardWindow\")
            if (count of theWindows) > \${i} then
                set targetWindow to item \${i + 1} of theWindows
                set position of targetWindow to {\${window.x}, \${window.y}}
                set size of targetWindow to {\${window.width}, \${window.height}}
                return \"success\"
            else
                return \"no window\"
            end if
        end tell
    on error errMsg
        return \"error: \" & errMsg
    end try
end tell\`;

        try {
            const result = execSync(\`osascript -e '\${script.replace(/'/g, '\\\"')}'\`, {
                encoding: 'utf8',
                timeout: 5000
            });

            if (result.trim() === 'success') {
                restored++;
                console.log(\`  ✅ Window \${i + 1}: \${window.x},\${window.y} \${window.width}x\${window.height}\`);
            } else {
                failed++;
                console.log(\`  ❌ Window \${i + 1}: \${result.trim()}\`);
            }
        } catch (error) {
            failed++;
            console.log(\`  ❌ Window \${i + 1}: Error\`);
        }

        // Small delay
        require('child_process').execSync('sleep 0.1');
    }
}

console.log(\`\\n📊 Restoration complete!\\n   ✅ \${restored} windows restored\\n   ❌ \${failed} windows failed\`);

if (restored > 0) {
    console.log('🎉 Your window layout has been restored across your monitors!');
}
"

echo "✨ Done!"