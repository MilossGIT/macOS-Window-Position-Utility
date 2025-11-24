import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WindowManager {
    constructor() {
        this.configPath = path.join(process.env.HOME, '.window-positions.json');
        this.nativeModule = null;
        this.initNativeModule();
    }

    async enhanceChromeWindows(windows) {
        try {
            const { execSync } = await import('child_process');

            // Check if Chrome is running first to avoid unnecessary AppleScript calls
            const chromeWindows = windows.filter(w => w.app === 'Google Chrome');
            if (chromeWindows.length === 0) {
                return windows;
            }

            // Simplified and robust AppleScript
            const result = execSync(`osascript -e 'tell application "System Events"
                try
                    if exists (application process "Google Chrome") then
                        tell application process "Google Chrome"
                            set windowTitles to {}
                            repeat with w in (every window whose subrole is "AXStandardWindow")
                                try
                                    set windowTitle to title of w as string
                                    if windowTitle is not missing value and windowTitle is not "" then
                                        set end of windowTitles to windowTitle
                                    else
                                        set end of windowTitles to "Chrome Window"
                                    end if
                                on error
                                    set end of windowTitles to "Chrome Window"
                                end try
                            end repeat

                            set AppleScript'"'"'s text item delimiters to "|~|"
                            set titleString to windowTitles as string
                            set AppleScript'"'"'s text item delimiters to ""
                            return titleString
                        end tell
                    else
                        return ""
                    end if
                on error errMsg
                    return ""
                end try
            end tell'`, {
                encoding: 'utf8',
                timeout: 8000,
                killSignal: 'SIGKILL'
            });

            // Check for errors or empty result
            if (result.trim() === '') {
                console.warn('Chrome enhancement failed or no windows found');
                return windows;
            }

            // Parse the titles using our custom delimiter
            const titles = result.trim().split('|~|').filter(t => t.trim() !== '');

            // Enhance Chrome windows in the original array
            let chromeIndex = 0;
            const enhancedWindows = windows.map(window => {
                if (window.app === 'Google Chrome' && chromeIndex < titles.length) {
                    const title = titles[chromeIndex];
                    chromeIndex++;
                    return {
                        ...window,
                        title: title || window.title
                    };
                }
                return window;
            });

            if (chromeIndex > 0) {
                console.log(`Enhanced ${chromeIndex} Chrome windows with titles`);
            }
            return enhancedWindows;

        } catch (error) {
            if (error.signal === 'SIGKILL') {
                console.warn('Chrome enhancement timed out - skipping title enhancement');
            } else {
                console.warn('Failed to enhance Chrome windows:', error.message);
            }
            return windows; // Return original windows if enhancement fails
        }
    }

    async enhanceAllWindows(windows) {
        try {
            const { execSync } = await import('child_process');

            // Group windows by app
            const appGroups = {};
            windows.forEach(window => {
                if (!appGroups[window.app]) {
                    appGroups[window.app] = [];
                }
                appGroups[window.app].push(window);
            });

            // Apps that benefit from title enhancement (have multiple windows often)
            const appsToEnhance = ['Google Chrome', 'Code', 'Visual Studio Code', 'Finder', 'Terminal'];

            let enhancedCount = 0;
            const enhancedWindows = [...windows];

            for (const appName of appsToEnhance) {
                if (appGroups[appName] && appGroups[appName].length > 1) {
                    try {
                        const result = execSync(`osascript -e 'tell application "System Events"
                            try
                                if exists (application process "${appName.replace(/"/g, '\\"')}") then
                                    tell application process "${appName.replace(/"/g, '\\"')}"
                                        set windowTitles to {}
                                        repeat with w in (every window whose subrole is "AXStandardWindow")
                                            try
                                                set windowTitle to title of w as string
                                                if windowTitle is not missing value and windowTitle is not "" then
                                                    set end of windowTitles to windowTitle
                                                else
                                                    set end of windowTitles to "${appName} Window"
                                                end if
                                            on error
                                                set end of windowTitles to "${appName} Window"
                                            end try
                                        end repeat

                                        set AppleScript'"'"'s text item delimiters to "|~|"
                                        set titleString to windowTitles as string
                                        set AppleScript'"'"'s text item delimiters to ""
                                        return titleString
                                    end tell
                                else
                                    return ""
                                end if
                            on error errMsg
                                return ""
                            end try
                        end tell'`, {
                            encoding: 'utf8',
                            timeout: 5000,
                            killSignal: 'SIGKILL'
                        });

                        if (result.trim() !== '') {
                            const titles = result.trim().split('|~|').filter(t => t.trim() !== '');

                            // Update the windows with proper titles
                            let appWindowIndex = 0;
                            for (let i = 0; i < enhancedWindows.length; i++) {
                                if (enhancedWindows[i].app === appName && appWindowIndex < titles.length) {
                                    enhancedWindows[i] = {
                                        ...enhancedWindows[i],
                                        title: titles[appWindowIndex] || enhancedWindows[i].title
                                    };
                                    appWindowIndex++;
                                }
                            }

                            if (appWindowIndex > 0) {
                                enhancedCount += appWindowIndex;
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to enhance ${appName} windows:`, error.message);
                    }
                }
            }

            if (enhancedCount > 0) {
                console.log(`Enhanced ${enhancedCount} windows with titles across multiple apps`);
            }

            return enhancedWindows;

        } catch (error) {
            console.warn('Window enhancement failed:', error.message);
            return windows;
        }
    }

    async checkAccessibilityPermissions() {
        try {
            const { execSync } = await import('child_process');
            const script = `
            tell application "System Events"
                try
                    set testProcess to first application process whose name is "Finder"
                    set testWindow to first window of testProcess
                    return "accessible"
                on error
                    return "not accessible"
                end try
            end tell`;

            const result = execSync(`osascript -e '${script.replace(/'/g, "\"")}'`, {
                encoding: 'utf8',
                timeout: 5000
            });

            return result.trim().includes('accessible');
        } catch (error) {
            return false;
        }
    }    async promptForPermissions() {
        console.log('\n🚫 Accessibility permissions required for window restoration!');
        console.log('\nTo grant permissions:');
        console.log('1. Open System Preferences (or System Settings on macOS Ventura+)');
        console.log('2. Go to Security & Privacy → Privacy → Accessibility');
        console.log('   (or Privacy & Security → Accessibility on macOS Ventura+)');
        console.log('3. Click the lock icon and enter your password');
        console.log('4. Click the "+" button and add your Terminal application');
        console.log('5. Make sure the checkbox next to Terminal is checked');
        console.log('6. Restart Terminal and try again');
        console.log('\nAlternatively, run this utility from VS Code\'s integrated terminal');
        console.log('if VS Code already has accessibility permissions.\n');
    }

    initNativeModule() {
        try {
            // Try to load the native module
            const bindingPath = resolve(dirname(__dirname), 'build/Release/window_manager.node');
            this.nativeModule = require(bindingPath);
        } catch (error) {
            console.warn('Native module not available. Using fallback AppleScript method.');
            console.warn('Run "npm run build" to compile the native module for better performance.');
        }
    }

    async savePositions() {
        try {
            let windows;

            if (this.nativeModule) {
                // Use native module for speed, but enhance windows with AppleScript
                windows = this.nativeModule.getAllWindows();
                windows = await this.enhanceAllWindows(windows);
            } else {
                windows = await this.getWindowsViaAppleScript();
            }

            const config = {
                timestamp: new Date().toISOString(),
                windows: windows
            };

            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            console.log(`Saved positions for ${windows.length} windows`);

        } catch (error) {
            console.error('Error saving window positions:', error);
            throw error;
        }
    }    async restorePositions() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);

            // Check accessibility permissions first
            const hasPermissions = await this.checkAccessibilityPermissions();
            if (!hasPermissions) {
                await this.promptForPermissions();
                console.log('\nSkipping restoration due to missing permissions.');
                return;
            }

            // Always use AppleScript for restoration as it can actually move windows
            // The native module can only detect windows, not move them reliably
            await this.restoreWindowsViaAppleScript(config.windows);

            console.log(`Restored positions for ${config.windows.length} windows`);

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error('No saved window positions found. Run "window-restore save" first.');
            } else {
                console.error('Error restoring window positions:', error);
            }
            throw error;
        }
    }    async getWindowsViaAppleScript() {
        const { execSync } = await import('child_process');

        const script = `
        tell application "System Events"
            set windowList to {}
            repeat with proc in (every process whose background only is false)
                tell proc
                    repeat with win in (every window whose subrole is "AXStandardWindow")
                        try
                            set winPosition to position of win
                            set winSize to size of win
                            set winTitle to title of win
                            set appName to name of proc
                            set windowInfo to {appName:appName, title:winTitle, x:(item 1 of winPosition), y:(item 2 of winPosition), width:(item 1 of winSize), height:(item 2 of winSize)}
                            set windowList to windowList & {windowInfo}
                        end try
                    end repeat
                end tell
            end repeat
            return windowList
        end tell`;

        try {
            const result = execSync(`osascript -e '${script.replace(/'/g, "\"")}'`, {
                encoding: 'utf8',
                timeout: 10000
            });

            // Parse the AppleScript result - this is a simplified parser
            // In a real implementation, you'd want more robust parsing
            return this.parseAppleScriptResult(result);

        } catch (error) {
            console.error('AppleScript execution failed:', error);
            return [];
        }
    }

    parseAppleScriptResult(result) {
        // This is a simplified parser for the AppleScript result
        // For a production app, you'd want to use a more robust method
        // or output the AppleScript data in JSON format

        const windows = [];
        const lines = result.split('\n');

        // This is a basic parser - you might need to adjust based on actual output
        for (const line of lines) {
            if (line.includes('appName:') && line.includes('title:')) {
                try {
                    // Extract window information using regex
                    const appMatch = line.match(/appName:([^,]+)/);
                    const titleMatch = line.match(/title:([^,]+)/);
                    const xMatch = line.match(/x:([^,]+)/);
                    const yMatch = line.match(/y:([^,]+)/);
                    const widthMatch = line.match(/width:([^,]+)/);
                    const heightMatch = line.match(/height:([^,]+)/);

                    if (appMatch && titleMatch && xMatch && yMatch && widthMatch && heightMatch) {
                        windows.push({
                            app: appMatch[1].trim(),
                            title: titleMatch[1].trim(),
                            x: parseInt(xMatch[1].trim()),
                            y: parseInt(yMatch[1].trim()),
                            width: parseInt(widthMatch[1].trim()),
                            height: parseInt(heightMatch[1].trim())
                        });
                    }
                } catch (error) {
                    console.warn('Failed to parse window data:', line);
                }
            }
        }

        return windows;
    }

    async restoreWindowsViaAppleScript(windows) {
        const { execSync } = await import('child_process');

        console.log(`Attempting to restore ${windows.length} windows...`);
        let restored = 0;
        let failed = 0;

        for (const window of windows) {
            // Skip windows with invalid dimensions
            if (window.width <= 0 || window.height <= 0) {
                console.warn(`Skipping window with invalid dimensions: ${window.app} - ${window.title}`);
                continue;
            }

            // Try to restore by app name and window title
            let script = `
            tell application "System Events"
                try
                    tell application process "${window.app.replace(/"/g, '\\"')}"
                        set theWindows to every window whose subrole is "AXStandardWindow"
                        if (count of theWindows) > 0 then
                            -- Try to find window by title first
                            set targetWindow to missing value
                            if "${window.title.replace(/"/g, '\\"')}" is not "" then
                                try
                                    set targetWindow to first window whose title is "${window.title.replace(/"/g, '\\"')}"
                                end try
                            end if

                            -- If no specific title match, use the first available window
                            if targetWindow is missing value then
                                set targetWindow to first window of theWindows
                            end if

                            -- Check if window is minimized and unminimize if needed
                            if value of attribute "AXMinimized" of targetWindow is true then
                                set value of attribute "AXMinimized" of targetWindow to false
                                delay 0.2
                            end if

                            -- Set position and size
                            set position of targetWindow to {${window.x}, ${window.y}}
                            set size of targetWindow to {${window.width}, ${window.height}}
                            return "success"
                        end if
                    end tell
                on error errMsg
                    return "error: " & errMsg
                end try
            end tell`;

            try {
                const result = execSync(`osascript -e '${script.replace(/'/g, "\"")}'`, {
                    encoding: 'utf8',
                    timeout: 10000
                });

                if (result.includes('success')) {
                    restored++;
                    console.log(`✓ Restored: ${window.app}${window.title ? ' - ' + window.title : ''}`);
                } else {
                    failed++;
                    console.warn(`✗ Failed to restore: ${window.app}${window.title ? ' - ' + window.title : ''} (${result.trim()})`);
                }
            } catch (error) {
                failed++;
                console.warn(`✗ Failed to restore: ${window.app}${window.title ? ' - ' + window.title : ''} (${error.message})`);
            }

            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`\nRestoration complete: ${restored} succeeded, ${failed} failed`);

        if (restored === 0 && failed > 0) {
            console.log('\n⚠️  No windows were restored. This might be because:');
            console.log('   • Terminal needs Accessibility permissions');
            console.log('   • Some applications were closed since saving');
            console.log('   • Window titles have changed');
            console.log('\nTo grant permissions:');
            console.log('   System Preferences → Security & Privacy → Privacy → Accessibility');
            console.log('   Add and enable your Terminal application');
        }
    }
}

// CLI interface
async function main() {
    const windowManager = new WindowManager();

    const command = process.argv[2] || 'help';

    switch (command) {
        case 'save':
            await windowManager.savePositions();
            break;
        case 'restore':
            await windowManager.restorePositions();
            break;
        case 'check':
            console.log('Checking accessibility permissions...');
            const hasPermissions = await windowManager.checkAccessibilityPermissions();
            if (hasPermissions) {
                console.log('✅ Accessibility permissions are granted!');
                console.log('You can now use "npm run restore" to restore window positions.');
            } else {
                console.log('❌ Accessibility permissions are not granted.');
                await windowManager.promptForPermissions();
            }
            break;
        case 'help':
        default:
            console.log(`
macOS Window Restore Utility

Usage:
  node src/index.js save     - Save current window positions
  node src/index.js restore  - Restore saved window positions
  node src/index.js check    - Check accessibility permissions
  npm run save              - Save current window positions
  npm run restore           - Restore saved window positions

The utility saves window positions to ~/.window-positions.json

Note: Window restoration requires accessibility permissions for Terminal.
Run 'node src/index.js check' to verify permissions.
            `);
            break;
    }
}// Only run main if this file is executed directly
import { pathToFileURL } from 'url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(console.error);
}