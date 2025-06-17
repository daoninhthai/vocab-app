import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database structure
const defaultData = {
  words: [],
  sentences: [],
  nextId: 1,
  nextSentenceId: 1
};

// Determine database path
// In packaged app (Electron), use user data directory
// In development, use local directory
let dbPath;

if (process.versions.electron) {
  // Running in Electron - use user data directory
  const userDataPath = join(homedir(), 'Library', 'Application Support', 'vocabmaster');

  // Create directory if it doesn't exist
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }

  dbPath = join(userDataPath, 'db.json');
  console.log('Database path (Electron):', dbPath);
} else {
  // Running standalone - use local directory
  dbPath = join(__dirname, 'db.json');
  console.log('Database path (Dev):', dbPath);
}

// Initialize database
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

// Read data from JSON file, this will set db.data content
await db.read();

// If file.json doesn't exist, db.data will be null
// Set default data
db.data ||= defaultData;

export default db;


/**
 * Debounce function to limit rapid invocations.
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};



/**
 * Formats a date string for display purposes.
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date string
 */
const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};



/**
 * Debounce function to limit rapid invocations.
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

