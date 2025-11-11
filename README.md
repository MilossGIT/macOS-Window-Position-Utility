# macOS Window Position Utility

A Node.js utility for macOS that remembers and restores window positions when displays change or when running a command manually. Perfect for multi-monitor setups!

## Features

- 🪟 **Save Window Positions**: Capture the current position and size of all visible application windows
- 🔄 **Restore Window Positions**: Restore windows to their previously saved positions
- 🖥️ **Multi-Monitor Support**: Handles external monitors with negative coordinates
- ⚡ **Fast Performance**: Uses native macOS APIs with AppleScript fallback
- 📱 **CLI Interface**: Simple command-line interface for easy automation
- 🔒 **Perfect for Lock/Unlock**: Restore your workspace after macOS moves windows around

## Installation

1. Clone this repository:
```bash
git clone https://github.com/MilossGIT/macOS-Window-Position-Utility.git
cd macOS-Window-Position-Utility
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Build the native module for better performance:
```bash
npm run build
```

## Usage

### Save current window positions
```bash
npm run save
```

### Restore saved window positions ✅ WORKING!
```bash
npm run restore
```

### Check accessibility permissions
```bash
npm run check
```

### Common Workflow

1. **Setup your workspace**: Arrange your windows exactly how you like them across your monitors
2. **Save positions**: Run `npm run save` to capture the current layout
3. **When displays change**: After reconnecting monitors, locking/unlocking, or any display changes, run `npm run restore`
4. **Perfect for multi-monitor setups**: The utility handles negative coordinates for external monitors automatically

### Example Usage
```bash
# Save your current 3-monitor window layout
npm run save

# Lock your Mac, windows get moved around...
# Unlock your Mac, then restore:
npm run restore
# 🎉 All 18+ windows restored to their exact positions!
```

## Configuration

Window positions are saved to `~/.window-positions.json`. This file contains:
- Timestamp of when positions were saved
- Array of window configurations (app name, title, position, size)

## Technical Details

### Two Implementation Methods

1. **Native Module** (Preferred): Uses CoreGraphics and Cocoa APIs for fast, reliable window detection
2. **AppleScript Fallback**: Uses AppleScript for compatibility when native module isn't available

### Requirements

- macOS 10.12 or later
- Node.js 16.0.0 or later
- Xcode Command Line Tools (for building native module)

### Permissions

For the AppleScript method to work properly, you may need to:
1. Grant "Accessibility" permissions to Terminal or your preferred terminal app
2. Go to System Preferences > Security & Privacy > Privacy > Accessibility
3. Add and enable your terminal application

## Automation

You can automate window restoration by:

1. **Creating an alias** in your shell profile:
```bash
# Add to ~/.zshrc or ~/.bash_profile
alias restore-windows="cd /path/to/macos-window-restore && npm run restore"
```

2. **Creating a global command**:
```bash
npm install -g .
# Then use: window-restore save/restore from anywhere
```

3. **Using with display change detection** (advanced):
You could combine this with display change detection scripts or keyboard shortcuts.

## Troubleshooting

### Native Module Build Issues
If `npm run build` fails:
- Make sure Xcode Command Line Tools are installed: `xcode-select --install`
- The app will fall back to AppleScript method automatically

### Permission Issues
If AppleScript method doesn't work:
- Check System Preferences > Security & Privacy > Privacy > Accessibility
- Add your terminal application to the list and enable it

### Windows Not Restoring Properly
- Some applications may not respond to position changes
- Windows that have been closed cannot be restored (only moved/resized)
- Some fullscreen or minimized windows may not be affected

## Development

To modify or extend the utility:

```bash
# Install dependencies
npm install

# Build native module
npm run build

# Test the utility
npm run save
npm run restore
```

## License

MIT License - see LICENSE file for details.

## Contributing

Feel free to submit issues and pull requests to improve the utility!