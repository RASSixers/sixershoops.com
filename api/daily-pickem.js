const crypto = require('crypto');

// ========================
// UTILITY FUNCTIONS
// ========================

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'daily-pickem-salt').digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify user token for daily pickem
async function verifyDailyToken(db, token) {
  if (!token) return null;
  
  const session = await db.get(
    'SELECT user_id FROM pickem_sessions WHERE token = ? AND expires_at > ?',
    [token, new Date().toISOString()]
  );
  
  if (!session) return null;
  
  const user = await db.get(
    'SELECT id, username, display_name FROM pickem_users WHERE id = ?',
    [session.user_id]
  );
  
  return { user, userId: session.user_id };
}

// ========================
// AUTH ROUTES
// ========================

async function handleDailyPickemAuth(app, db) {
  // Register
  app.post('/api/daily-pickem/register', async (req, res) => {
    try {
      const { username, password, displayName, email } = req.body;

      if (!username || !password || !displayName) {
        return res.status(400).json({
          success: false,
          error: 'Username, password, and display name required'
        });
      }

      // Check if user exists
      const existing = await db.get(
        'SELECT id FROM pickem_users WHERE username = ?',
        [username]
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Username already taken'
        });
      }

      // Check if email is already registered (if provided)
      if (email) {
        const existingEmail = await db.get(
          'SELECT id FROM pickem_users WHERE email = ?',
          [email]
        );
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: 'Email already registered'
          });
        }
      }

      const passwordHash = hashPassword(password);
      const userEmail = email || `${username}@daily-pickem.local`;
      const result = await db.run(
        `INSERT INTO pickem_users (username, email, password_hash, display_name)
         VALUES (?, ?, ?, ?)`,
        [username, userEmail, passwordHash, displayName]
      );

      const userId = result.lastID;
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.run(
        'INSERT INTO pickem_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt.toISOString()]
      );

      res.status(201).json({
        success: true,
        user: {
          id: userId,
          username,
          displayName
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Login
  app.post('/api/daily-pickem/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password required'
        });
      }

      const user = await db.get(
        'SELECT * FROM pickem_users WHERE username = ?',
        [username]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const passwordHash = hashPassword(password);
      if (passwordHash !== user.password_hash) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.run(
        'INSERT INTO pickem_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt.toISOString()]
      );

      await db.run(
        'UPDATE pickem_users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Logout
  app.post('/api/daily-pickem/logout', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await db.run('DELETE FROM pickem_sessions WHERE token = ?', [token]);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Verify token
  app.post('/api/daily-pickem/verify', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }

      res.json({
        success: true,
        user: auth.user
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// ========================
// QUESTIONS ROUTES
// ========================

async function handleDailyPickemQuestions(app, db) {
  // Get today's question
  app.get('/api/daily-pickem/today-question', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const today = new Date().toISOString().split('T')[0];

      const question = await db.get(
        'SELECT * FROM daily_questions WHERE question_date = ?',
        [today]
      );

      if (!question) {
        return res.json({
          success: true,
          question: null,
          message: 'No question for today'
        });
      }

      // Parse options if they exist
      if (question.options) {
        try {
          question.options = JSON.parse(question.options);
        } catch (e) {
          question.options = [];
        }
      }

      // Remove answer from user view if not yet graded
      if (!question.is_graded) {
        question.correct_answer = null;
      }

      res.json({ success: true, question });
    } catch (error) {
      console.error('Error fetching today question:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get question for a specific date (for viewing past results)
  app.get('/api/daily-pickem/question/:date', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const question = await db.get(
        'SELECT * FROM daily_questions WHERE question_date = ?',
        [req.params.date]
      );

      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      if (question.options) {
        try {
          question.options = JSON.parse(question.options);
        } catch (e) {
          question.options = [];
        }
      }

      res.json({ success: true, question });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Create or update question for a date
  app.post('/api/daily-pickem/admin/question', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Check if user is admin (you can customize this logic)
      const user = await db.get(
        'SELECT * FROM pickem_users WHERE id = ?',
        [auth.userId]
      );

      // Simple admin check - you may want a role system
      if (!user || user.username !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { date, questionText, type, options } = req.body;

      if (!date || !questionText || !type) {
        return res.status(400).json({
          success: false,
          error: 'Date, question text, and type required'
        });
      }

      const optionsJson = options ? JSON.stringify(options) : null;

      const existing = await db.get(
        'SELECT id FROM daily_questions WHERE question_date = ?',
        [date]
      );

      if (existing) {
        await db.run(
          `UPDATE daily_questions 
           SET question_text = ?, question_type = ?, options = ?, updated_at = ?
           WHERE question_date = ?`,
          [questionText, type, optionsJson, new Date().toISOString(), date]
        );
      } else {
        await db.run(
          `INSERT INTO daily_questions (question_date, question_text, question_type, options)
           VALUES (?, ?, ?, ?)`,
          [date, questionText, type, optionsJson]
        );
      }

      res.json({
        success: true,
        message: 'Question saved'
      });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin: Set answer and grade all picks
  app.post('/api/daily-pickem/admin/grade/:date', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await db.get(
        'SELECT * FROM pickem_users WHERE id = ?',
        [auth.userId]
      );

      if (!user || user.username !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { correctAnswer } = req.body;
      const date = req.params.date;

      if (!correctAnswer) {
        return res.status(400).json({
          success: false,
          error: 'Correct answer required'
        });
      }

      // Update question
      await db.run(
        `UPDATE daily_questions 
         SET correct_answer = ?, answer_set_at = ?, is_graded = 1
         WHERE question_date = ?`,
        [correctAnswer, new Date().toISOString(), date]
      );

      // Grade all picks
      await db.run(
        `UPDATE daily_picks 
         SET is_correct = (user_answer = ?), graded_at = ?
         WHERE question_date = ? AND is_correct IS NULL`,
        [correctAnswer, new Date().toISOString(), date]
      );

      // Recalculate leaderboards
      await recalculateLeaderboards(db, date);

      res.json({
        success: true,
        message: 'Picks graded and leaderboard updated'
      });
    } catch (error) {
      console.error('Error grading:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// ========================
// PICKS ROUTES
// ========================

async function handleDailyPickemPicks(app, db) {
  // Submit today's pick
  app.post('/api/daily-pickem/submit-pick', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { answer } = req.body;
      const userId = auth.userId;
      const today = new Date().toISOString().split('T')[0];

      if (!answer) {
        return res.status(400).json({
          success: false,
          error: 'Answer required'
        });
      }

      // Check if question exists
      const question = await db.get(
        'SELECT * FROM daily_questions WHERE question_date = ?',
        [today]
      );

      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'No question for today'
        });
      }

      // Check if already submitted
      const existing = await db.get(
        'SELECT id FROM daily_picks WHERE user_id = ? AND question_date = ?',
        [userId, today]
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'You already submitted a pick for today'
        });
      }

      // Save pick
      await db.run(
        `INSERT INTO daily_picks (user_id, question_date, user_answer, submitted_at)
         VALUES (?, ?, ?, ?)`,
        [userId, today, answer, new Date().toISOString()]
      );

      res.json({
        success: true,
        message: 'Pick submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting pick:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get user's pick for today
  app.get('/api/daily-pickem/my-pick', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const today = new Date().toISOString().split('T')[0];
      const pick = await db.get(
        `SELECT dp.*, dq.correct_answer, dq.is_graded
         FROM daily_picks dp
         JOIN daily_questions dq ON dp.question_date = dq.question_date
         WHERE dp.user_id = ? AND dp.question_date = ?`,
        [auth.userId, today]
      );

      res.json({ success: true, pick: pick || null });
    } catch (error) {
      console.error('Error fetching pick:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// ========================
// LEADERBOARD ROUTES
// ========================

async function handleDailyPickemLeaderboard(app, db) {
  // Get daily leaderboard
  app.get('/api/daily-pickem/leaderboard/daily', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const today = new Date().toISOString().split('T')[0];
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const leaderboard = await db.all(`
        SELECT 
          pu.id as user_id,
          pu.username,
          pu.display_name,
          COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) as correct_answers,
          COUNT(dp.id) as total_picks,
          ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) DESC) as rank
        FROM pickem_users pu
        LEFT JOIN daily_picks dp ON pu.id = dp.user_id AND dp.question_date = ?
        WHERE pu.is_active = 1
        GROUP BY pu.id
        ORDER BY correct_answers DESC, pu.username ASC
        LIMIT ? OFFSET ?
      `, [today, limit, offset]);

      const total = await db.get(
        'SELECT COUNT(*) as count FROM pickem_users WHERE is_active = 1'
      );

      res.json({
        success: true,
        leaderboard,
        total: total?.count || 0,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching daily leaderboard:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get weekly leaderboard
  app.get('/api/daily-pickem/leaderboard/weekly', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      // Get start of current week (Monday)
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const leaderboard = await db.all(`
        SELECT 
          pu.id as user_id,
          pu.username,
          pu.display_name,
          COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) as correct_answers,
          COUNT(dp.id) as total_picks,
          ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) DESC) as rank
        FROM pickem_users pu
        LEFT JOIN daily_picks dp ON pu.id = dp.user_id AND dp.question_date >= ?
        WHERE pu.is_active = 1 AND (dp.question_date IS NULL OR dp.question_date < DATE('now', '+7 days'))
        GROUP BY pu.id
        ORDER BY correct_answers DESC, pu.username ASC
        LIMIT ? OFFSET ?
      `, [weekStartStr, limit, offset]);

      const total = await db.get(
        'SELECT COUNT(*) as count FROM pickem_users WHERE is_active = 1'
      );

      res.json({
        success: true,
        leaderboard,
        period: `Week of ${weekStartStr}`,
        total: total?.count || 0,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get monthly leaderboard
  app.get('/api/daily-pickem/leaderboard/monthly', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const auth = await verifyDailyToken(db, token);

      if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      // Get start of current month
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const leaderboard = await db.all(`
        SELECT 
          pu.id as user_id,
          pu.username,
          pu.display_name,
          COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) as correct_answers,
          COUNT(dp.id) as total_picks,
          ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN dp.is_correct = 1 THEN 1 END) DESC) as rank
        FROM pickem_users pu
        LEFT JOIN daily_picks dp ON pu.id = dp.user_id AND dp.question_date >= ?
        WHERE pu.is_active = 1 AND (dp.question_date IS NULL OR dp.question_date < DATE('now', '+30 days'))
        GROUP BY pu.id
        ORDER BY correct_answers DESC, pu.username ASC
        LIMIT ? OFFSET ?
      `, [monthStartStr, limit, offset]);

      const total = await db.get(
        'SELECT COUNT(*) as count FROM pickem_users WHERE is_active = 1'
      );

      res.json({
        success: true,
        leaderboard,
        period: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total: total?.count || 0,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching monthly leaderboard:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// ========================
// HELPER FUNCTIONS
// ========================

async function recalculateLeaderboards(db, date) {
  try {
    // Get all users with picks on this date
    const users = await db.all(
      'SELECT DISTINCT user_id FROM daily_picks WHERE question_date = ?',
      [date]
    );

    const dateObj = new Date(date);
    
    // Calculate daily leaderboard
    for (const user of users) {
      const dailyStats = await db.get(
        `SELECT 
          COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct,
          COUNT(*) as total
         FROM daily_picks
         WHERE user_id = ? AND question_date = ?`,
        [user.user_id, date]
      );

      if (dailyStats && dailyStats.total > 0) {
        await db.run(
          `INSERT INTO daily_leaderboard (user_id, leaderboard_date, period_type, correct_answers, total_picks)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, leaderboard_date, period_type) DO UPDATE SET
           correct_answers = ?, total_picks = ?, last_updated = ?`,
          [user.user_id, date, 'daily', dailyStats.correct, dailyStats.total,
           dailyStats.correct, dailyStats.total, new Date().toISOString()]
        );
      }
    }

    // Calculate weekly leaderboard (Monday of the week)
    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() - dateObj.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    for (const user of users) {
      const weeklyStats = await db.get(
        `SELECT 
          COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct,
          COUNT(*) as total
         FROM daily_picks
         WHERE user_id = ? AND question_date >= ? AND question_date < DATE(?, '+7 days')`,
        [user.user_id, weekStartStr, weekStartStr]
      );

      if (weeklyStats && weeklyStats.total > 0) {
        await db.run(
          `INSERT INTO daily_leaderboard (user_id, leaderboard_date, period_type, correct_answers, total_picks)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, leaderboard_date, period_type) DO UPDATE SET
           correct_answers = ?, total_picks = ?, last_updated = ?`,
          [user.user_id, weekStartStr, 'weekly', weeklyStats.correct, weeklyStats.total,
           weeklyStats.correct, weeklyStats.total, new Date().toISOString()]
        );
      }
    }

    // Calculate monthly leaderboard (1st of the month)
    const monthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    for (const user of users) {
      const monthlyStats = await db.get(
        `SELECT 
          COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct,
          COUNT(*) as total
         FROM daily_picks
         WHERE user_id = ? AND question_date >= ? AND question_date < DATE(?, '+30 days')`,
        [user.user_id, monthStartStr, monthStartStr]
      );

      if (monthlyStats && monthlyStats.total > 0) {
        await db.run(
          `INSERT INTO daily_leaderboard (user_id, leaderboard_date, period_type, correct_answers, total_picks)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, leaderboard_date, period_type) DO UPDATE SET
           correct_answers = ?, total_picks = ?, last_updated = ?`,
          [user.user_id, monthStartStr, 'monthly', monthlyStats.correct, monthlyStats.total,
           monthlyStats.correct, monthlyStats.total, new Date().toISOString()]
        );
      }
    }
  } catch (error) {
    console.error('Error recalculating leaderboards:', error);
  }
}

module.exports = {
  handleDailyPickemAuth,
  handleDailyPickemQuestions,
  handleDailyPickemPicks,
  handleDailyPickemLeaderboard
};
