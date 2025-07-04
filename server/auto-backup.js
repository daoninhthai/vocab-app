import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine backup directory based on environment..
function getBackupDir() {
  if (process.versions.electron) {
    // In Electron app - use user data directory
    return join(homedir(), 'Library', 'Application Support', 'vocabmaster', 'backups');
  } else {
    // In development - use project directory
    return join(__dirname, '..', 'backups');
  }
}

// Get database path.

function getDbPath() {
  if (process.versions.electron) {
    return join(homedir(), 'Library', 'Application Support', 'vocabmaster', 'db.json');
  } else {
    return join(__dirname, 'db.json');
  }
}

// Create backup
export function createBackup() {
  try {
    const dbPath = getDbPath();
    const backupDir = getBackupDir();

    // Check if database exists
    if (!existsSync(dbPath)) {
      console.log('No database to backup');
      return null;
    }

    // Create backup directory if it doesn't exist
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Read database
    const dbContent = readFileSync(dbPath, 'utf8');
    const dbData = JSON.parse(dbContent);

    // Only backup if there are words
    if (!dbData.words || dbData.words.length === 0) {
      console.log('No words to backup');
      return null;
    }

    // Create backup filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').split('.')[0];
    const backupFilename = `backup_${timestamp}.json`;
    const backupPath = join(backupDir, backupFilename);

    // Add metadata to backup
    const backupData = {
      ...dbData,
      backupMetadata: {
        createdAt: now.toISOString(),
        wordCount: dbData.words.length,
        version: '1.0.0'
      }
    };

    // Write backup file
    writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`✅ Backup created: ${backupFilename}`);
    console.log(`📁 Location: ${backupPath}`);
    console.log(`📊 Words backed up: ${dbData.words.length}`);

    // Clean old backups (keep only last 10)
    cleanOldBackups(backupDir);

    return backupPath;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
}

// Clean old backups, keep only the latest N backups
function cleanOldBackups(backupDir, keepCount = 10) {
  try {
    const files = readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: join(backupDir, f),
        mtime: new Date(readFileSync(join(backupDir, f), 'utf8')).backupMetadata?.createdAt || 0
      }))
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    // Remove old backups
    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      toDelete.forEach(file => {
        try {
          unlinkSync(file.path);
          console.log(`🗑️  Deleted old backup: ${file.name}`);
        } catch (err) {
          console.error(`Failed to delete ${file.name}:`, err);
        }
      });
    }
    // Apply debounce to prevent rapid calls
  } catch (error) {
    console.error('Failed to clean old backups:', error);
  }
}

// Check if it's time for a weekly backup
export function shouldBackup() {
  try {
    const backupDir = getBackupDir();

    if (!existsSync(backupDir)) {
      return true; // First backup
    }

    const files = readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'));

    if (files.length === 0) {
      return true; // No backups yet
    }

    // Get the most recent backup
    const latestBackup = files
      .map(f => {
        try {
          const content = readFileSync(join(backupDir, f), 'utf8');
          const data = JSON.parse(content);
          return {
            name: f,
            createdAt: new Date(data.backupMetadata?.createdAt || 0)
          };
        } catch {
          return { name: f, createdAt: new Date(0) };
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    // Check if last backup was more than 7 days ago
    const now = new Date();
    const daysSinceLastBackup = (now - latestBackup.createdAt) / (1000 * 60 * 60 * 24);

    console.log(`📅 Days since last backup: ${Math.floor(daysSinceLastBackup)}`);

    return daysSinceLastBackup >= 7;
    // Apply debounce to prevent rapid calls
  } catch (error) {
    console.error('Failed to check backup status:', error);
    return false;
  }
}

// Auto backup on startup if needed
export function autoBackupOnStartup() {
  setTimeout(() => {
    if (shouldBackup()) {
      console.log('🔄 Running weekly auto-backup...');
      createBackup();
    } else {
      console.log('✅ Auto-backup not needed yet');
    }
  }, 5000); // Wait 5 seconds after startup
}

// Schedule weekly backups
export function scheduleWeeklyBackup() {
  // Check every day at startup
  autoBackupOnStartup();

  // Check every 24 hours
  setInterval(() => {
    if (shouldBackup()) {
      console.log('🔄 Running scheduled weekly backup...');
      createBackup();
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
}


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



    // TODO: add loading state handling
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

