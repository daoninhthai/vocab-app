import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';
import { scheduleWeeklyBackup, createBackup } from './auto-backup.js';
import { loadSettings, saveSettings, showDailyReminder } from './daily-reminder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8688;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Helper functions
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

const INTERVALS = {
  0: 0,    // New - no interval
  1: 2,    // Lần 1 - 2 ngày
  2: 4,    // Lần 2 - 4 ngày
  3: 7,    // Lần 3 - 1 tuần
  4: 14,   // Lần 4 - 2 tuần
  5: 21,   // Lần 5 - 3 tuần
  6: 30,   // Lần 6 - 1 tháng (và định kỳ)
};

// Check and reset words that are due for review
const checkDueWords = () => {
  const todayStr = today();
  let updated = false;

  db.data.words = db.data.words.map(word => {
    if (word.level > 0 && word.nextReviewDate && word.nextReviewDate <= todayStr) {
      updated = true;
      return { ...word, level: 0, maxLevel: word.level, lastLearnedDate: null, nextReviewDate: null };
    }
    return word;
  });

  if (updated) {
    db.write();
  }
};

// Check and reset sentences that are due for review
const checkDueSentences = () => {
  const todayStr = today();
  let updated = false;

  db.data.sentences = (db.data.sentences || []).map(sentence => {
    if (sentence.level > 0 && sentence.nextReviewDate && sentence.nextReviewDate <= todayStr) {
      updated = true;
      return { ...sentence, level: 0, maxLevel: sentence.level, lastLearnedDate: null, nextReviewDate: null };
    }
    return sentence;
  });

  if (updated) {
    db.write();
  }
};

// API Routes

// Get all words
app.get('/api/words', async (req, res) => {
  try {
    await db.read();
    checkDueWords();
    res.json(db.data.words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single word by ID
app.get('/api/words/:id', async (req, res) => {
  try {
    await db.read();
    const word = db.data.words.find(w => w.id === parseInt(req.params.id));

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new word
app.post('/api/words', async (req, res) => {
  try {
    const { word, ipaUK, ipaUS, meaningEN, meaningVI, example } = req.body;

    if (!word || !meaningVI) {
      return res.status(400).json({ error: 'Word and meaningVI are required' });
    }

    await db.read();

    const todayStr = today();
    const newWord = {
      id: db.data.nextId++,
      word,
      ipaUK: ipaUK || null,
      ipaUS: ipaUS || null,
      meaningEN: meaningEN || null,
      meaningVI,
      example: example || null,
      level: 0,
      dateAdded: todayStr,
      lastLearnedDate: null,
      nextReviewDate: null,
      history: []
    };

    db.data.words.unshift(newWord);
    await db.write();

    res.status(201).json(newWord);
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a word
app.put('/api/words/:id', async (req, res) => {
  try {
    const { word, ipaUK, ipaUS, meaningEN, meaningVI, example } = req.body;

    await db.read();

    const index = db.data.words.findIndex(w => w.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Word not found' });
    }

    db.data.words[index] = {
      ...db.data.words[index],
      word,
      ipaUK: ipaUK || null,
      ipaUS: ipaUS || null,
      meaningEN: meaningEN || null,
      meaningVI,
      example: example || null
    };

    await db.write();

    res.json(db.data.words[index]);
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a word
app.delete('/api/words/:id', async (req, res) => {
  try {
    await db.read();

    const index = db.data.words.findIndex(w => w.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Word not found' });
    }

    db.data.words.splice(index, 1);
    await db.write();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark word as learned (increase level)
app.post('/api/words/:id/learn', async (req, res) => {
  try {
    await db.read();

    const index = db.data.words.findIndex(w => w.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const word = db.data.words[index];
    const todayStr = today();
    // If word was reset to 0 for review, use maxLevel to determine next level
    const newLevel = (word.level === 0 && word.maxLevel) ? Math.min(word.maxLevel + 1, 6) : Math.min(word.level + 1, 6);
    const interval = INTERVALS[newLevel];
    const nextReview = addDays(todayStr, interval);

    // Update word
    db.data.words[index] = {
      ...word,
      level: newLevel,
      maxLevel: null,
      lastLearnedDate: todayStr,
      nextReviewDate: nextReview,
      history: [
        ...(word.history || []),
        { date: todayStr, fromLevel: word.level, toLevel: newLevel }
      ]
    };

    await db.write();

    res.json(db.data.words[index]);
  } catch (error) {
    console.error('Error learning word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset word to level 0
app.post('/api/words/:id/reset', async (req, res) => {
  try {
    await db.read();

    const index = db.data.words.findIndex(w => w.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Word not found' });
    }

    db.data.words[index] = {
      ...db.data.words[index],
      level: 0,
      lastLearnedDate: null,
      nextReviewDate: null
    };

    await db.write();

    res.json(db.data.words[index]);
  } catch (error) {
    console.error('Error resetting word:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export all words
app.get('/api/export', async (req, res) => {
  try {
    await db.read();
    res.json(db.data.words);
  } catch (error) {
    console.error('Error exporting words:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import words (bulk insert)
app.post('/api/import', async (req, res) => {
  try {
    const words = req.body;

    if (!Array.isArray(words)) {
      return res.status(400).json({ error: 'Expected an array of words' });
    }

    await db.read();

    const existingWords = new Set(db.data.words.map(w => w.word.toLowerCase()));
    let imported = 0;
    let skipped = 0;

    for (const word of words) {
      if (!existingWords.has(word.word.toLowerCase())) {
        const newWord = {
          id: db.data.nextId++,
          word: word.word,
          ipaUK: word.ipaUK || null,
          ipaUS: word.ipaUS || null,
          meaningEN: word.meaningEN || null,
          meaningVI: word.meaningVI || null,
          example: word.example || null,
          level: word.level || 0,
          dateAdded: word.dateAdded || today(),
          lastLearnedDate: word.lastLearnedDate || null,
          nextReviewDate: word.nextReviewDate || null,
          history: word.history || []
        };

        db.data.words.push(newWord);
        existingWords.add(word.word.toLowerCase());
        imported++;
      } else {
        skipped++;
      }
    }

    await db.write();

    res.json({
      success: true,
      imported,
      skipped
    });
  } catch (error) {
    console.error('Error importing words:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual backup endpoint
app.post('/api/backup', async (req, res) => {
  try {
    const backupPath = createBackup();
    if (backupPath) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        path: backupPath
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No data to backup'
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reminder settings
app.get('/api/settings/reminder', async (req, res) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update reminder settings
app.post('/api/settings/reminder', async (req, res) => {
  try {
    const settings = req.body;
    await saveSettings(settings);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test reminder (manual trigger)
app.post('/api/reminder/test', async (req, res) => {
  try {
    await showDailyReminder(db);
    res.json({ success: true, message: 'Test reminder sent' });
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    await db.read();
    checkDueWords();

    const todayStr = today();
    const total = db.data.words.length;

    const byLevel = {};
    for (let i = 0; i <= 6; i++) {
      byLevel[i] = db.data.words.filter(w => w.level === i).length;
    }

    const dueToday = db.data.words.filter(w => w.nextReviewDate === todayStr).length;
    const learned = db.data.words.filter(w => w.level > 0).length;
    const mastered = db.data.words.filter(w => w.level === 6).length;

    res.json({
      total,
      byLevel,
      dueToday,
      learned,
      mastered
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// ============================================
// SENTENCES API ENDPOINTS
// ============================================

// Get all sentences

app.get('/api/sentences', (req, res) => {
  checkDueSentences();
  res.json(db.data.sentences || []);
});

// Get sentence by ID
app.get('/api/sentences/:id', (req, res) => {
  const sentence = db.data.sentences.find(s => s.id === parseInt(req.params.id));
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
  res.json(sentence);
});

// Add new sentence
app.post('/api/sentences', async (req, res) => {
  const { en, vi, category } = req.body;

  if (!en || !vi) {
    return res.status(400).json({ error: 'English and Vietnamese are required' });
  }

  const newSentence = {
    id: db.data.nextSentenceId++,
    en,
    vi,
    category: category || 'Custom',
    level: 0,
    dateAdded: new Date().toISOString().split('T')[0],
    lastLearnedDate: null,
    nextReviewDate: null,
    history: []
  };

  db.data.sentences.push(newSentence);
  await db.write();

  res.json(newSentence);
});

// Mark sentence as learned (move to next level)
app.post('/api/sentences/:id/learned', async (req, res) => {
  const sentence = db.data.sentences.find(s => s.id === parseInt(req.params.id));
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });

  const oldLevel = sentence.level;
  const todayStr = today();

  // If sentence was reset to 0 for review, use maxLevel to determine next level
  const newLevel = (oldLevel === 0 && sentence.maxLevel) ? Math.min(sentence.maxLevel + 1, 6) : Math.min(oldLevel + 1, 6);

  sentence.history.push({
    date: todayStr,
    fromLevel: oldLevel,
    toLevel: newLevel,
    action: 'learned'
  });

  sentence.level = newLevel;
  sentence.maxLevel = null;
  sentence.lastLearnedDate = todayStr;

  // Calculate next review date
  if (sentence.level > 0) {
    sentence.nextReviewDate = addDays(todayStr, INTERVALS[sentence.level]);
  } else {
    sentence.nextReviewDate = null;
  }

  await db.write();
  res.json(sentence);
    // Validate input before processing
});

// Reset sentence to level 0
app.post('/api/sentences/:id/reset', async (req, res) => {
  const sentence = db.data.sentences.find(s => s.id === parseInt(req.params.id));
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });

  const oldLevel = sentence.level;
  const today = new Date().toISOString().split('T')[0];

  sentence.history.push({
    date: today,
    fromLevel: oldLevel,
    toLevel: 0,
    action: 'reset'
  });

  sentence.level = 0;
  sentence.nextReviewDate = null;

  await db.write();
  res.json(sentence);
});

// Delete sentence
app.delete('/api/sentences/:id', async (req, res) => {
  const index = db.data.sentences.findIndex(s => s.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Sentence not found' });

  db.data.sentences.splice(index, 1);
  await db.write();

  res.json({ success: true });
});

// Import sentences from JSON file
app.post('/api/sentences/import-default', async (req, res) => {
  try {
    const { readFileSync } = await import('fs');
    const sentencesData = JSON.parse(readFileSync(join(__dirname, 'sentences-data.json'), 'utf8'));

    // Initialize sentences array if not exists
    if (!db.data.sentences) {
      db.data.sentences = [];
    }
    if (!db.data.nextSentenceId) {
      db.data.nextSentenceId = 1;
    }

    let imported = 0;
    let skipped = 0;

    for (const categoryData of sentencesData) {
      for (const sentence of categoryData.sentences) {
        // Check if sentence already exists
        const exists = db.data.sentences.some(s => s.en.toLowerCase() === sentence.en.toLowerCase());

        if (!exists) {
          const newSentence = {
            id: db.data.nextSentenceId++,
            en: sentence.en,
            vi: sentence.vi,
            category: categoryData.category,
            level: 0,
            dateAdded: new Date().toISOString().split('T')[0],
            lastLearnedDate: null,
            nextReviewDate: null,
            history: []
          };
          db.data.sentences.push(newSentence);
          imported++;
        } else {
          skipped++;
        }
      }
    }

    await db.write();
    res.json({ imported, skipped, total: imported + skipped });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import sentences' });
  }
});

// ============================================
// STUDY TIMER API ENDPOINTS
// ============================================

const DAILY_GOAL_MS = 3 * 60 * 60 * 1000; // 3 hours in ms

// Initialize studyTimer in DB if not exists
const initStudyTimer = () => {
  if (!db.data.studyTimer) {
    db.data.studyTimer = {
      isRunning: false,
      startedAt: null,
      todayStudied: 0, // ms studied today
      todayDate: today(),
      carryOver: 0, // ms carried over (positive = surplus, negative = debt)
      history: [] // { date, studied, goal, carryOver }
    };
  }
  // Roll over to new day if needed
  rollOverDay();
};

const rollOverDay = () => {
  const t = db.data.studyTimer;
  const todayStr = today();
  if (t.todayDate !== todayStr) {
    // Calculate how much was studied vs goal
    const effectiveGoal = DAILY_GOAL_MS - t.carryOver; // if carryOver positive, less to study
    const surplus = t.todayStudied - effectiveGoal; // positive = studied more than needed

    // Save history for old day
    t.history.push({
      date: t.todayDate,
      studied: t.todayStudied,
      goal: DAILY_GOAL_MS,
      carryOver: t.carryOver
    });
    // Keep only last 90 days
    if (t.history.length > 90) t.history = t.history.slice(-90);

    // Process each day between todayDate and today
    const oldDate = new Date(t.todayDate);
    const newDate = new Date(todayStr);
    const daysDiff = Math.floor((newDate - oldDate) / (1000 * 60 * 60 * 24));

    // For skipped days (more than 1 day gap), accumulate debt
    let newCarryOver = surplus;
    for (let i = 1; i < daysDiff; i++) {
      // Each skipped day adds 3h debt
      newCarryOver -= DAILY_GOAL_MS;
      const skippedDate = new Date(oldDate);
      skippedDate.setDate(skippedDate.getDate() + i);
      t.history.push({
        date: skippedDate.toISOString().split('T')[0],
        studied: 0,
        goal: DAILY_GOAL_MS,
        carryOver: 0
      });
    }

    t.carryOver = newCarryOver;
    t.todayStudied = 0;
    t.todayDate = todayStr;
    t.isRunning = false;
    t.startedAt = null;
    db.write();
  }
};

// Get timer status
app.get('/api/timer', (req, res) => {
  initStudyTimer();
  const t = db.data.studyTimer;

  // If timer is running, add elapsed time
  let totalStudied = t.todayStudied;
  if (t.isRunning && t.startedAt) {
    totalStudied += Date.now() - new Date(t.startedAt).getTime();
  }

  const effectiveGoal = DAILY_GOAL_MS - t.carryOver;
  const remaining = Math.max(0, effectiveGoal - totalStudied);

  res.json({
    isRunning: t.isRunning,
    todayStudied: totalStudied,
    effectiveGoal,
    remaining,
    carryOver: t.carryOver,
    dailyGoal: DAILY_GOAL_MS,
    todayDate: t.todayDate,
    history: t.history.slice(-30)
  });
});

// Start timer
app.post('/api/timer/start', async (req, res) => {
  initStudyTimer();
  const t = db.data.studyTimer;
  if (!t.isRunning) {
    t.isRunning = true;
    t.startedAt = new Date().toISOString();
    await db.write();
  }
  res.json({ ok: true, startedAt: t.startedAt });
});

// Stop timer
app.post('/api/timer/stop', async (req, res) => {
  initStudyTimer();
  const t = db.data.studyTimer;
  if (t.isRunning && t.startedAt) {
    const elapsed = Date.now() - new Date(t.startedAt).getTime();
    t.todayStudied += elapsed;
    t.isRunning = false;
    t.startedAt = null;
    await db.write();
  }
  res.json({ ok: true, todayStudied: t.todayStudied });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${join(__dirname, 'db.json')}`);

  // Start auto-backup scheduler
  console.log('🔄 Starting auto-backup scheduler...');
  scheduleWeeklyBackup();
});

export { server };


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

