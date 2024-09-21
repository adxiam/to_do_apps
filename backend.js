const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware for user authentication
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'list_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Register a new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Hash the password for security
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) throw err;

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          res.json({ error: 'Username already exists' });
        } else {
          throw err;
        }
      } else {
        res.json({ success: 'User registered successfully' });
      }
    });
  });
});

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const user = result[0];

      // Compare the hashed password
      bcrypt.compare(password, user.password, (err, match) => {
        if (match) {
          // Set session for logged-in user
          req.session.userId = user.id;
          res.json({ success: 'Login successful' });
        } else {
          res.json({ error: 'Invalid password' });
        }
      });
    } else {
      res.json({ error: 'User not found' });
    }
  });
});

// Fetch tasks for the logged-in user
app.get('/tasks', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Add task for the logged-in user
app.post('/add-task', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { task } = req.body;

  db.query('INSERT INTO tasks (user_id, task) VALUES (?, ?)', [req.session.userId, task], (err, result) => {
    if (err) throw err;
    res.json({ success: 'Task added' });
  });
});

// Delete task (based on task ID) for the logged-in user
app.post('/delete-task', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { taskId } = req.body;

  db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.session.userId], (err, result) => {
    if (err) throw err;
    res.json({ success: 'Task deleted' });
  });
});

// Log out user
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: 'Logged out' });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
