const Database = require('better-sqlite3');
const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE COLLATE NOCASE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
  );
`);
const bcrypt = require('bcryptjs');
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!admin) {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
        .run('admin', bcrypt.hashSync('admin123', 10), 'admin');
}

module.exports = db;