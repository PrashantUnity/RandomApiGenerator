import { HTTP_METHODS, type HttpMethod } from '../types'

export type RequestSectionProps = {
  running: boolean
  electron: unknown
  requestMethod: HttpMethod
  displayUrl: string
  placeholderUrl: string
  sampleCount: string
  showCountQuery: boolean
  showRequestBodyEditor: boolean
  requestBody: string
  onRequestMethodChange: (m: HttpMethod) => void
  onSampleCountChange: (v: string) => void
  onRequestBodyChange: (v: string) => void
  onSend: () => void
}

export function RequestSection({
  running,
  electron,
  requestMethod,
  displayUrl,
  placeholderUrl,
  sampleCount,
  showCountQuery,
  showRequestBodyEditor,
  requestBody,
  onRequestMethodChange,
  onSampleCountChange,
  onRequestBodyChange,
  onSend,
}: RequestSectionProps) {
  const mockSendBlocked = !running
  const sendDisabled = !electron || mockSendBlocked

  let sendTitle = `Send HTTP ${requestMethod} request`
  if (!electron) {
    sendTitle = 'Requires Electron desktop app'
  } else if (mockSendBlocked) {
    sendTitle = 'Start the mock server first'
  }

  return (
    <section className="pm-request" aria-label="Request">
      <div className="pm-request__row">
        <label className="pm-request__method" title="HTTP method">
          <span className="pm-sr-only">HTTP method</span>
          <select
            className="pm-request__method-select"
            value={requestMethod}
            onChange={(e) => onRequestMethodChange(e.target.value as HttpMethod)}
            aria-label="HTTP method"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <div className="pm-request__url-wrap">
          <label className="pm-sr-only" htmlFor="pm-request-display-url">
            Request URL (mock server base and path)
          </label>
          <input
            id="pm-request-display-url"
            className="pm-request__url"
            readOnly
            value={displayUrl || placeholderUrl}
            placeholder="Start the server to build the request URL"
          />
        </div>
        <button
          type="button"
          className="pm-btn pm-btn--send"
          disabled={sendDisabled}
          title={sendTitle}
          onClick={() => void onSend()}
          aria-label={sendTitle}
        >
          Send
        </button>
      </div>

      {!running && electron ? (
        <p className="pm-request__hint">
          <strong>Mock server is off.</strong> Click <strong>Start</strong> above to serve your routes on{' '}
          <code>127.0.0.1</code>. Need to hit an external API without the mock? Switch to{' '}
          <strong>Query API</strong> mode in the sidebar.
        </p>
      ) : null}

      {running ? (
        <p className="pm-request__hint pm-request__hint--muted">
          Traffic goes to the <strong>local mock</strong> only. Edit the route on the Response tab.
        </p>
      ) : null}

      {showCountQuery && (
        <div className="pm-request__meta">
          <label className="pm-query">
            <span className="pm-query__key">count</span>
            <input
              className="pm-query__val"
              value={sampleCount}
              onChange={(e) => onSampleCountChange(e.target.value)}
              inputMode="numeric"
              aria-label="Number of sample records (count query parameter)"
            />
          </label>
        </div>
      )}

      {showRequestBodyEditor && (
        <div className="pm-request__body">
          <label className="pm-request__body-label" htmlFor="pm-request-body">
            Body (JSON)
          </label>
          <textarea
            id="pm-request-body"
            className="pm-request__body-input"
            value={requestBody}
            onChange={(e) => onRequestBodyChange(e.target.value)}
            placeholder="Optional JSON object to merge with the mock response"
            spellCheck={false}
            aria-label="Request body JSON"
          />
        </div>
      )}
    </section>
  )
}
