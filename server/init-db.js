import db from './database.js';


console.log('Initializing database...');

// Ensure the data structure exists
db.data ||= { words: [], nextId: 1 };

// Write to file
await db.write();

console.log('Database initialized successfully!');
console.log('Database file: server/db.json');
console.log('Structure: { words: [], nextId: 1 }');


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

