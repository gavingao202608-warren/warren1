-- SQLite MVP schema; vehicle facts use the typed Vehicle JSON payload.
CREATE TABLE IF NOT EXISTS vehicles(id TEXT PRIMARY KEY, payload TEXT NOT NULL, misses INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sync_runs(id INTEGER PRIMARY KEY,started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,count INTEGER,error TEXT);
CREATE TABLE IF NOT EXISTS inquiries(inquiry_id TEXT PRIMARY KEY,session_id TEXT NOT NULL,vehicle_id TEXT,source TEXT NOT NULL,question TEXT NOT NULL,created_at TEXT NOT NULL,contact_method TEXT,contact_value TEXT,consent INTEGER);
CREATE TABLE IF NOT EXISTS visits(id INTEGER PRIMARY KEY,session_id TEXT NOT NULL,first_source TEXT NOT NULL,current_source TEXT NOT NULL,landing_page TEXT NOT NULL,vehicle_id TEXT,timestamp TEXT NOT NULL,utm TEXT);
CREATE INDEX IF NOT EXISTS visits_time ON visits(timestamp);
