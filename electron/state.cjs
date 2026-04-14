/** Shared mutable refs for the main process (window, mock server, DB). */
module.exports = {
  mainWindow: null,
  mockServer: null,
  /** @type {import('better-sqlite3').Database | null} */
  appDb: null,
  /** True when `openDb` threw (SQLite unavailable). */
  persistDbUnavailable: false,
};
