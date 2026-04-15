import type { AppUiMode, EndpointConfig, HttpMethod, MockCollection, MockWorkspace } from '../types'

export type AppTitlebarProps = {
  uiMode?: AppUiMode
  selectedWorkspace: MockWorkspace | undefined
  selectedCollection: MockCollection | undefined
  selected: EndpointConfig | undefined
  /** Effective HTTP method for the selected route (per-route or default). */
  httpMethod?: HttpMethod
  /** Active environment name (for `{{var}}` in paths). */
  environmentName?: string
}

export function AppTitlebar({
  uiMode = 'genApi',
  selectedWorkspace,
  selectedCollection,
  selected,
  httpMethod,
  environmentName,
}: AppTitlebarProps) {
  if (uiMode === 'queryApi') {
    return (
      <header className="pm-titlebar" aria-label="Application header — Query API">
        <div className="pm-titlebar__breadcrumb">
          <span className="pm-titlebar__workspace">Random API Generator · CodeFryDev</span>
          <span className="pm-titlebar__sep">/</span>
          <span className="pm-titlebar__req">
            Query API · <span className="pm-titlebar__path">HTTP client</span>
          </span>
        </div>
      </header>
    )
  }

  return (
    <header className="pm-titlebar" aria-label="Application header — mock route">
      <div className="pm-titlebar__breadcrumb">
        <span className="pm-titlebar__workspace">Random API Generator · CodeFryDev</span>
        <span className="pm-titlebar__sep">/</span>
        <span className="pm-titlebar__req">
          {selectedWorkspace?.name ?? 'workspace'}
          <span className="pm-titlebar__sep"> / </span>
          {selectedCollection?.name ?? 'collection'}
          <span className="pm-titlebar__sep"> / </span>
          {httpMethod ? (
            <>
              <span
                className={`pm-method-badge pm-method-badge--compact pm-method-badge--${httpMethod}`}
                title="HTTP method for this route"
              >
                {httpMethod}
              </span>
              <span className="pm-titlebar__sep"> / </span>
            </>
          ) : null}
          <span className="pm-titlebar__path">{selected?.path ? `/${selected.path.replace(/^\/+/, '')}` : 'route'}</span>
          {environmentName ? (
            <span className="pm-titlebar__env" title="Variables from this environment apply to path segments">
              {' '}
              · <span className="pm-titlebar__env-name">{environmentName}</span>
            </span>
          ) : null}
        </span>
      </div>
    </header>
  )
}
