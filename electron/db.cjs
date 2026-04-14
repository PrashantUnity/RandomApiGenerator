const path = require('path');
const Database = require('better-sqlite3');

/**
 * @param {string} userDataPath
 * @returns {import('better-sqlite3').Database}
 */
function openDb(userDataPath) {
  const dbPath = path.join(userDataPath, 'random-api-generator.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      endpoints_json TEXT NOT NULL,
      selected_index INTEGER NOT NULL DEFAULT 0,
      request_method TEXT NOT NULL DEFAULT 'GET',
      sample_count TEXT NOT NULL DEFAULT '3'
    );
  `);
  return db;
}

/**
 * @param {import('better-sqlite3').Database} db
 * @returns {{
 *   raw: unknown;
 *   legacySelectedIndex: number;
 *   legacyRequestMethod: string;
 *   legacySampleCount: string;
 * } | null}
 */
function loadState(db) {
  const row = db
    .prepare(
      'SELECT endpoints_json, selected_index, request_method, sample_count FROM app_state WHERE id = 1',
    )
    .get();
  if (!row) return null;
  let parsed;
  try {
    parsed = JSON.parse(row.endpoints_json);
  } catch {
    return null;
  }
  return {
    raw: parsed,
    legacySelectedIndex: row.selected_index,
    legacyRequestMethod: row.request_method,
    legacySampleCount: row.sample_count,
  };
}

/**
 * Persist full v2 state blob in `endpoints_json` (version + workspaces + selection + request prefs).
 * Legacy columns kept for schema compatibility; values are placeholders when using v2 JSON.
 * @param {import('better-sqlite3').Database} db
 * @param {unknown} state v2 PersistedAppState object
 */
function saveState(db, state) {
  const endpointsJson = JSON.stringify(state);
  db.prepare(
    `
    INSERT INTO app_state (id, endpoints_json, selected_index, request_method, sample_count)
    VALUES (1, ?, 0, 'GET', '3')
    ON CONFLICT(id) DO UPDATE SET
      endpoints_json = excluded.endpoints_json,
      selected_index = excluded.selected_index,
      request_method = excluded.request_method,
      sample_count = excluded.sample_count
  `,
  ).run(endpointsJson, 0, 'GET', '3');
}

module.exports = { openDb, loadState, saveState };
