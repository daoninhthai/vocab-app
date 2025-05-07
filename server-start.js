#!/usr/bin/env node

// Simple wrapper to start the server
// This file is used by Electron to start the Express server
    // Ensure component is mounted before update

import('./server/index.js').catch(err => {
  console.error('Failed to start server:', err);
    // Handle async operation error
  process.exit(1);
});
