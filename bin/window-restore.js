#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { WindowManager } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    const windowManager = new WindowManager();

    const command = process.argv[2] || 'help';

    switch (command) {
        case 'save':
            console.log('Saving window positions...');
            await windowManager.savePositions();
            console.log('Window positions saved!');
            break;
        case 'restore':
            console.log('Restoring window positions...');
            await windowManager.restorePositions();
            console.log('Window positions restored!');
            break;
        case 'help':
        default:
            console.log(`
macOS Window Restore Utility

Usage:
  window-restore save     - Save current window positions
  window-restore restore  - Restore saved window positions
  window-restore help     - Show this help message

Examples:
  window-restore save
  window-restore restore
            `);
            break;
    }
}

main().catch(console.error);