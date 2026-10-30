const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(session({ secret: 'change-this-secret', resave: false, saveUninitialized: false }));
app.use(express.static('public'));

const bcrypt = require('bcryptjs');

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    try {
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
            .run(username, bcrypt.hashSync(password, 10));
        res.json({ ok: true });
    } catch {
        res.status(400).json({ error: 'Username already taken' });
    }
});

app.post('/api/login', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username);
    if (!user || !bcrypt.compareSync(req.body.password, user.password))
        return res.status(401).json({ error: 'Invalid login' });
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json(req.session.user);
});

function requireLogin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Login required' });
    next();
}
function requireAdmin(req, res, next) {
    if (req.session.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    next();
}

// READ - All
app.get('/api/items', requireLogin, (req, res) => {
    res.json(db.prepare('SELECT * FROM items ORDER BY name').all());
});

// CREATE - All (duplicates increase quantity)
app.post('/api/items', requireLogin, (req, res) => {
    const { name, quantity = 1 } = req.body;
    db.prepare(`
    INSERT INTO items (name, quantity) VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(name.trim(), Number(quantity));
    res.json({ ok: true });
});

// UPDATE - admin only
app.put('/api/items/:id', requireLogin, requireAdmin, (req, res) => {
    db.prepare('UPDATE items SET name = ?, quantity = ? WHERE id = ?')
        .run(req.body.name, req.body.quantity, req.params.id);
    res.json({ ok: true });
});

// DELETE - admin only
app.delete('/api/items/:id', requireLogin, requireAdmin, (req, res) => {
    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => res.json(req.session.user || null));

app.listen(3000, () => console.log('Running on http://localhost:3000'));
