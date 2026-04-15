import type { MockDataMode, MockEnvironment, ServerStatusPayload } from '../types'

export type ServerStatusBarProps = {
  busy: boolean
  running: boolean
  server: ServerStatusPayload
  electron: unknown
  exampleResponseError: string | null
  mockDataMode: MockDataMode
  onMockDataModeChange: (mode: MockDataMode) => void
  onStart: () => void
  onStop: () => void
  environments: MockEnvironment[]
  selectedEnvironmentId: string
  onEnvironmentChange: (environmentId: string) => void
  /** Opens the tab where variables and import/export live. */
  onOpenVariablesAndImport?: () => void
}

export function ServerStatusBar({
  busy,
  running,
  server,
  electron,
  exampleResponseError,
  mockDataMode,
  onMockDataModeChange,
  onStart,
  onStop,
  environments,
  selectedEnvironmentId,
  onEnvironmentChange,
  onOpenVariablesAndImport,
}: ServerStatusBarProps) {
  return (
    <div
      className={`pm-server-bar ${busy ? 'pm-server-bar--busy' : ''}`}
      aria-busy={busy}
    >
      <div className="pm-server-bar__cluster">
        <div className="pm-server-bar__mock-mode" role="group" aria-label="Mock data generation">
          <span className="pm-server-bar__mock-label">Mock data</span>
          <div className="pm-segmented">
            <button
              type="button"
              className={`pm-segmented__btn ${mockDataMode === 'seeded' ? 'pm-segmented__btn--active' : ''}`}
              onClick={() => onMockDataModeChange('seeded')}
              aria-pressed={mockDataMode === 'seeded'}
            >
              Seeded
            </button>
            <button
              type="button"
              className={`pm-segmented__btn ${mockDataMode === 'random' ? 'pm-segmented__btn--active' : ''}`}
              onClick={() => onMockDataModeChange('random')}
              aria-pressed={mockDataMode === 'random'}
            >
              Random
            </button>
          </div>
        </div>
        <div className="pm-server-bar__env" role="group" aria-label="Environment for path variables">
          <span className="pm-server-bar__mock-label">Environment</span>
          <div className="pm-server-bar__env-row">
            <label className="pm-sr-only" htmlFor="pm-env-select-main">
              Active environment
            </label>
            <select
              id="pm-env-select-main"
              className="pm-server-bar__env-select"
              value={selectedEnvironmentId}
              onChange={(e) => onEnvironmentChange(e.target.value)}
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
            {onOpenVariablesAndImport ? (
              <button
                type="button"
                className="pm-server-bar__link-btn"
                onClick={onOpenVariablesAndImport}
                aria-label="Open import, export, and environment variables"
              >
                Import &amp; export
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className="pm-server-bar__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={`pm-dot ${running ? 'pm-dot--on' : server.status === 'error' ? 'pm-dot--err' : ''}`}
          aria-hidden="true"
        />
        <span className="pm-server-bar__label">
          {running && server.baseUrl
            ? server.baseUrl
            : server.status === 'error'
              ? (server.error ?? 'Error')
              : 'Mock server offline'}
        </span>
      </div>
      <div className="pm-server-bar__actions">
        <button
          type="button"
          className="pm-btn pm-btn--ghost"
          disabled={!electron || busy || running || Boolean(exampleResponseError)}
          onClick={() => void onStart()}
          aria-label={busy ? 'Starting server' : 'Start mock server'}
        >
          Start
        </button>
        <button
          type="button"
          className="pm-btn pm-btn--ghost"
          disabled={!electron || busy || !running}
          onClick={() => void onStop()}
          aria-label={busy ? 'Stopping server' : 'Stop mock server'}
        >
          Stop
        </button>
      </div>
    </div>
  )
}
