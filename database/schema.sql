-- NBA Live Game Database Schema
-- This schema stores live game data, play-by-play history, and box scores

-- Main game data table for storing complete game information
CREATE TABLE IF NOT EXISTS game_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE NOT NULL,
    season TEXT NOT NULL DEFAULT '2024-25',
    game_date DATE NOT NULL,
    home_team_id TEXT NOT NULL,
    away_team_id TEXT NOT NULL,
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    game_status INTEGER NOT NULL, -- 1=scheduled, 2=live, 3=final
    period INTEGER DEFAULT 0,
    game_clock TEXT DEFAULT '12:00',
    venue TEXT,
    tv_broadcast TEXT,
    play_by_play TEXT, -- JSON data
    box_score TEXT, -- JSON data
    game_detail TEXT, -- JSON data
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Play-by-play history table for detailed game actions
CREATE TABLE IF NOT EXISTS play_by_play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    action_id INTEGER NOT NULL,
    action_number INTEGER NOT NULL,
    period INTEGER NOT NULL,
    period_type TEXT DEFAULT 'REGULAR', -- REGULAR, OVERTIME
    game_clock TEXT NOT NULL,
    time_actual DATETIME,
    description TEXT NOT NULL,
    formatted_description TEXT, -- Enhanced description with emojis/formatting
    score_away INTEGER DEFAULT 0,
    score_home INTEGER DEFAULT 0,
    action_type TEXT NOT NULL,
    sub_type TEXT,
    player_id TEXT,
    player_name TEXT,
    team_id TEXT,
    team_abbreviation TEXT,
    x_coordinate REAL,
    y_coordinate REAL,
    shot_distance INTEGER,
    shot_made BOOLEAN,
    assist_player_id TEXT,
    assist_player_name TEXT,
    rebound_type TEXT, -- OFFENSIVE, DEFENSIVE
    foul_type TEXT,
    turnover_type TEXT,
    is_video_available BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game_data(game_id)
);

-- Player statistics table for box score data
CREATE TABLE IF NOT EXISTS player_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT,
    starter BOOLEAN DEFAULT FALSE,
    played BOOLEAN DEFAULT FALSE,
    minutes_played TEXT DEFAULT '0:00',
    points INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    field_goal_percentage REAL DEFAULT 0.0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    three_point_percentage REAL DEFAULT 0.0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    free_throw_percentage REAL DEFAULT 0.0,
    rebounds_offensive INTEGER DEFAULT 0,
    rebounds_defensive INTEGER DEFAULT 0,
    rebounds_total INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    personal_fouls INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game_data(game_id)
);

-- Team statistics table for game-level team stats
CREATE TABLE IF NOT EXISTS team_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    team_abbreviation TEXT NOT NULL,
    is_home_team BOOLEAN NOT NULL,
    points INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    field_goal_percentage REAL DEFAULT 0.0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    three_point_percentage REAL DEFAULT 0.0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    free_throw_percentage REAL DEFAULT 0.0,
    rebounds_offensive INTEGER DEFAULT 0,
    rebounds_defensive INTEGER DEFAULT 0,
    rebounds_total INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    personal_fouls INTEGER DEFAULT 0,
    technical_fouls INTEGER DEFAULT 0,
    flagrant_fouls INTEGER DEFAULT 0,
    largest_lead INTEGER DEFAULT 0,
    time_leading TEXT DEFAULT '0:00',
    points_in_paint INTEGER DEFAULT 0,
    points_off_turnovers INTEGER DEFAULT 0,
    second_chance_points INTEGER DEFAULT 0,
    fast_break_points INTEGER DEFAULT 0,
    bench_points INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game_data(game_id)
);

-- Quarter/period scores table
CREATE TABLE IF NOT EXISTS period_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_abbreviation TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    period_type TEXT DEFAULT 'REGULAR', -- REGULAR, OVERTIME
    score INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game_data(game_id)
);

-- Game schedule table (integrated with existing schedule data)
CREATE TABLE IF NOT EXISTS game_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE,
    season TEXT NOT NULL DEFAULT '2024-25',
    game_date DATE NOT NULL,
    game_time TIME NOT NULL,
    home_team_id TEXT NOT NULL,
    away_team_id TEXT NOT NULL,
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    venue TEXT,
    tv_broadcast TEXT,
    game_status TEXT DEFAULT 'scheduled', -- scheduled, live, final, postponed, cancelled
    is_playoffs BOOLEAN DEFAULT FALSE,
    is_play_in BOOLEAN DEFAULT FALSE,
    is_all_star BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Live game alerts table for notifications
CREATE TABLE IF NOT EXISTS live_game_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- game_start, quarter_end, final, milestone
    alert_message TEXT NOT NULL,
    alert_data TEXT, -- JSON data for additional context
    is_sent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game_data(game_id)
);

-- API request logs for monitoring
CREATE TABLE IF NOT EXISTS api_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    game_id TEXT,
    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_status INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    user_agent TEXT,
    ip_address TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_data_game_id ON game_data(game_id);
CREATE INDEX IF NOT EXISTS idx_game_data_date ON game_data(game_date);
CREATE INDEX IF NOT EXISTS idx_game_data_status ON game_data(game_status);
CREATE INDEX IF NOT EXISTS idx_game_data_teams ON game_data(home_team_id, away_team_id);

CREATE INDEX IF NOT EXISTS idx_play_by_play_game_id ON play_by_play_history(game_id);
CREATE INDEX IF NOT EXISTS idx_play_by_play_period ON play_by_play_history(game_id, period);
CREATE INDEX IF NOT EXISTS idx_play_by_play_action ON play_by_play_history(game_id, action_number);
CREATE INDEX IF NOT EXISTS idx_play_by_play_player ON play_by_play_history(player_id);
CREATE INDEX IF NOT EXISTS idx_play_by_play_team ON play_by_play_history(team_id);
CREATE INDEX IF NOT EXISTS idx_play_by_play_type ON play_by_play_history(action_type);

CREATE INDEX IF NOT EXISTS idx_player_stats_game_player ON player_statistics(game_id, player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_statistics(team_id);

CREATE INDEX IF NOT EXISTS idx_team_stats_game_team ON team_statistics(game_id, team_id);

CREATE INDEX IF NOT EXISTS idx_period_scores_game ON period_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_period_scores_team ON period_scores(team_id);

CREATE INDEX IF NOT EXISTS idx_schedule_date ON game_schedule(game_date);
CREATE INDEX IF NOT EXISTS idx_schedule_teams ON game_schedule(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON game_schedule(game_status);

CREATE INDEX IF NOT EXISTS idx_alerts_game ON live_game_alerts(game_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON live_game_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_sent ON live_game_alerts(is_sent);

CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_request_logs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint);

-- Views for common queries

-- Current live games view
CREATE VIEW IF NOT EXISTS current_live_games AS
SELECT 
    gd.*,
    ht.team_name as home_team_display,
    at.team_name as away_team_display
FROM game_data gd
LEFT JOIN (
    SELECT DISTINCT team_id, team_name 
    FROM team_statistics 
    WHERE is_home_team = 1
) ht ON gd.home_team_id = ht.team_id
LEFT JOIN (
    SELECT DISTINCT team_id, team_name 
    FROM team_statistics 
    WHERE is_home_team = 0
) at ON gd.away_team_id = at.team_id
WHERE gd.game_status = 2
ORDER BY gd.last_updated DESC;

-- Sixers games view
CREATE VIEW IF NOT EXISTS sixers_games AS
SELECT 
    gd.*,
    CASE 
        WHEN gd.home_team_id = '1610612755' THEN 'HOME'
        ELSE 'AWAY'
    END as sixers_location,
    CASE 
        WHEN gd.home_team_id = '1610612755' THEN gd.away_team_name
        ELSE gd.home_team_name
    END as opponent_name,
    CASE 
        WHEN gd.home_team_id = '1610612755' THEN gd.home_score
        ELSE gd.away_score
    END as sixers_score,
    CASE 
        WHEN gd.home_team_id = '1610612755' THEN gd.away_score
        ELSE gd.home_score
    END as opponent_score
FROM game_data gd
WHERE gd.home_team_id = '1610612755' OR gd.away_team_id = '1610612755'
ORDER BY gd.game_date DESC;

-- Recent play-by-play view (last 50 plays)
CREATE VIEW IF NOT EXISTS recent_plays AS
SELECT 
    pbp.*,
    gd.home_team_name,
    gd.away_team_name,
    gd.game_status
FROM play_by_play_history pbp
JOIN game_data gd ON pbp.game_id = gd.game_id
WHERE gd.game_status = 2  -- Only live games
ORDER BY pbp.game_id, pbp.action_number DESC
LIMIT 50;

-- Top performers view
CREATE VIEW IF NOT EXISTS top_performers AS
SELECT 
    ps.*,
    gd.game_date,
    gd.home_team_name,
    gd.away_team_name,
    CASE 
        WHEN ps.team_id = gd.home_team_id THEN gd.home_team_name
        ELSE gd.away_team_name
    END as player_team_name
FROM player_statistics ps
JOIN game_data gd ON ps.game_id = gd.game_id
WHERE ps.played = 1
ORDER BY ps.points DESC, ps.rebounds_total DESC, ps.assists DESC;

-- Insert sample data for testing (Philadelphia 76ers team ID: 1610612755)
INSERT OR IGNORE INTO game_schedule (
    game_id, season, game_date, game_time, 
    home_team_id, away_team_id, home_team_name, away_team_name,
    venue, tv_broadcast, game_status
) VALUES 
('0022400001', '2024-25', '2025-10-22', '19:30:00', 
 '1610612738', '1610612755', 'Boston Celtics', 'Philadelphia 76ers',
 'TD Garden', 'ESPN', 'scheduled'),
('0022400002', '2024-25', '2025-10-25', '19:30:00', 
 '1610612755', '1610612766', 'Philadelphia 76ers', 'Charlotte Hornets',
 'Wells Fargo Center', 'NBC Sports Philadelphia', 'scheduled');

-- Triggers for automatic updates

-- Update last_updated timestamp when game_data is modified
CREATE TRIGGER IF NOT EXISTS update_game_data_timestamp 
AFTER UPDATE ON game_data
BEGIN
    UPDATE game_data 
    SET last_updated = CURRENT_TIMESTAMP 
    WHERE game_id = NEW.game_id;
END;

-- Update team statistics when player statistics change
CREATE TRIGGER IF NOT EXISTS update_team_stats_on_player_change
AFTER INSERT ON player_statistics
BEGIN
    INSERT OR REPLACE INTO team_statistics (
        game_id, team_id, team_name, team_abbreviation, is_home_team,
        points, field_goals_made, field_goals_attempted,
        three_pointers_made, three_pointers_attempted,
        free_throws_made, free_throws_attempted,
        rebounds_total, assists, steals, blocks, turnovers
    )
    SELECT 
        NEW.game_id,
        NEW.team_id,
        (SELECT home_team_name FROM game_data WHERE game_id = NEW.game_id AND home_team_id = NEW.team_id
         UNION
         SELECT away_team_name FROM game_data WHERE game_id = NEW.game_id AND away_team_id = NEW.team_id),
        CASE NEW.team_id
            WHEN '1610612755' THEN '76'
            WHEN '1610612738' THEN 'BOS'
            -- Add more team mappings as needed
            ELSE 'UNK'
        END,
        CASE WHEN gd.home_team_id = NEW.team_id THEN 1 ELSE 0 END,
        COALESCE(SUM(ps.points), 0),
        COALESCE(SUM(ps.field_goals_made), 0),
        COALESCE(SUM(ps.field_goals_attempted), 0),
        COALESCE(SUM(ps.three_pointers_made), 0),
        COALESCE(SUM(ps.three_pointers_attempted), 0),
        COALESCE(SUM(ps.free_throws_made), 0),
        COALESCE(SUM(ps.free_throws_attempted), 0),
        COALESCE(SUM(ps.rebounds_total), 0),
        COALESCE(SUM(ps.assists), 0),
        COALESCE(SUM(ps.steals), 0),
        COALESCE(SUM(ps.blocks), 0),
        COALESCE(SUM(ps.turnovers), 0)
    FROM player_statistics ps
    JOIN game_data gd ON ps.game_id = gd.game_id
    WHERE ps.game_id = NEW.game_id AND ps.team_id = NEW.team_id;
END;

-- =====================================================
-- NBA PICK'EM SYSTEM TABLES
-- =====================================================

-- Users table for pick'em
CREATE TABLE IF NOT EXISTS pickem_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Games for pick'em (games users make picks for)
CREATE TABLE IF NOT EXISTS pickem_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE NOT NULL,
    game_date DATETIME NOT NULL,
    home_team_id TEXT NOT NULL,
    home_team_name TEXT NOT NULL,
    away_team_id TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, live, final
    home_score INTEGER,
    away_score INTEGER,
    winning_team_id TEXT, -- ID of winning team (after game ends)
    picks_locked BOOLEAN DEFAULT 0, -- True when game starts
    graded BOOLEAN DEFAULT 0, -- True after game ends and picks are graded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User picks table
CREATE TABLE IF NOT EXISTS pickem_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id TEXT NOT NULL,
    picked_team_id TEXT NOT NULL,
    picked_team_name TEXT NOT NULL,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES pickem_users(id),
    FOREIGN KEY (game_id) REFERENCES pickem_games(game_id),
    UNIQUE(user_id, game_id)
);

-- Leaderboard view data (cached for performance)
CREATE TABLE IF NOT EXISTS pickem_leaderboard (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    total_picks INTEGER DEFAULT 0,
    correct_picks INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    win_percentage REAL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES pickem_users(id)
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS pickem_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES pickem_users(id)
);

-- Indexes for pick'em
CREATE INDEX IF NOT EXISTS idx_pickem_users_username ON pickem_users(username);
CREATE INDEX IF NOT EXISTS idx_pickem_users_email ON pickem_users(email);
CREATE INDEX IF NOT EXISTS idx_pickem_games_date ON pickem_games(game_date);
CREATE INDEX IF NOT EXISTS idx_pickem_games_status ON pickem_games(status);
CREATE INDEX IF NOT EXISTS idx_pickem_picks_user ON pickem_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_pickem_picks_game ON pickem_picks(game_id);
CREATE INDEX IF NOT EXISTS idx_pickem_picks_user_game ON pickem_picks(user_id, game_id);

-- =====================================================
-- CUSTOM QUESTIONS PICK'EM SYSTEM
-- =====================================================

-- Question sets (contests/events)
CREATE TABLE IF NOT EXISTS question_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- active, closed, graded, archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- multiple_choice, yes_no, numeric
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES question_sets(id)
);

-- Question options (for multiple choice)
CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_value TEXT NOT NULL, -- Internal value for grading
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Correct answers (admin sets these)
CREATE TABLE IF NOT EXISTS question_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    answer_value TEXT NOT NULL,
    set_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- User picks for questions
CREATE TABLE IF NOT EXISTS user_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    picked_value TEXT NOT NULL,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    UNIQUE(set_id, user_id, question_id),
    FOREIGN KEY (set_id) REFERENCES question_sets(id),
    FOREIGN KEY (user_id) REFERENCES pickem_users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Question set leaderboard (scores per set)
CREATE TABLE IF NOT EXISTS set_leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    win_percentage REAL DEFAULT 0.0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    UNIQUE(set_id, user_id),
    FOREIGN KEY (set_id) REFERENCES question_sets(id),
    FOREIGN KEY (user_id) REFERENCES pickem_users(id)
);

-- Indexes for custom questions
CREATE INDEX IF NOT EXISTS idx_questions_set ON questions(set_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_set ON user_picks(set_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_user ON user_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_set_user ON user_picks(set_id, user_id);
CREATE INDEX IF NOT EXISTS idx_set_leaderboard_set ON set_leaderboard(set_id);
CREATE INDEX IF NOT EXISTS idx_set_leaderboard_user ON set_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_pickem_sessions_user ON pickem_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pickem_sessions_token ON pickem_sessions(token);

-- ===================================
-- DAILY PICK'EM SYSTEM (NEW)
-- ===================================

-- Daily questions table (one set per day)
CREATE TABLE IF NOT EXISTS daily_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_date DATE NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'yn' (yes/no), 'mc' (multiple choice), 'numeric'
    options TEXT, -- JSON array for multiple choice: [{"label": "...", "value": "..."}]
    correct_answer TEXT, -- Answer set by admin after deadline
    answer_set_at DATETIME,
    is_graded BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily user picks table
CREATE TABLE IF NOT EXISTS daily_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_date DATE NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    UNIQUE(user_id, question_date),
    FOREIGN KEY (user_id) REFERENCES pickem_users(id),
    FOREIGN KEY (question_date) REFERENCES daily_questions(question_date)
);

-- Daily leaderboard (calculated stats for time periods)
CREATE TABLE IF NOT EXISTS daily_leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    leaderboard_date DATE NOT NULL, -- Start date of the period (day for daily, Monday for weekly, 1st for monthly)
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    correct_answers INTEGER DEFAULT 0,
    total_picks INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, leaderboard_date, period_type),
    FOREIGN KEY (user_id) REFERENCES pickem_users(id)
);

-- Indexes for daily pickem
CREATE INDEX IF NOT EXISTS idx_daily_questions_date ON daily_questions(question_date);
CREATE INDEX IF NOT EXISTS idx_daily_picks_user ON daily_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON daily_picks(question_date);
CREATE INDEX IF NOT EXISTS idx_daily_picks_user_date ON daily_picks(user_id, question_date);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_user ON daily_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_date ON daily_leaderboard(leaderboard_date);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_period ON daily_leaderboard(period_type);
CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_user_period ON daily_leaderboard(user_id, period_type);
