#!/usr/bin/env node

/**
 * Jewbot CLI Wrapper
 * Allows running the bot via npx or global installation.
 */

const path = require('path');
const fs = require('fs');

// Ensure we are in the right directory or can find the source
const rootDir = path.join(__dirname, '..');
const srcIndex = path.join(rootDir, 'src', 'index.js');

if (!fs.existsSync(srcIndex)) {
    console.error("❌ Could not find Jewbot source files. Make sure you are running from the package root.");
    process.exit(1);
}

// Pass control to the main index file
require(srcIndex);
