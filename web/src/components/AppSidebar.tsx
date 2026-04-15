import type { Dispatch, SetStateAction } from 'react'
import type { AppUiMode, HttpMethod, PersistedAppState } from '../types'
import { CODEFRYDEV_URL } from '../constants'
import {
  MAX_COLLECTIONS_PER_WORKSPACE,
  MAX_WORKSPACES,
  addCollectionToWorkspace,
  addWorkspace,
  selectRoute,
  setCollectionName,
  setWorkspaceName,
  switchWorkspace,
} from '../workspaceModel'

type ElectronApi = NonNullable<Window['electronAPI']>

export type AppSidebarProps = {
  tree: PersistedAppState
  setTree: Dispatch<SetStateAction<PersistedAppState>>
  uiMode: AppUiMode
  onUiModeChange: (mode: AppUiMode) => void
  running: boolean
  electron: ElectronApi | undefined
  /** Default method for new routes and fallback when a route has no per-route method. */
  defaultRequestMethod: HttpMethod
  workspaceRenameOpen: boolean
  setWorkspaceRenameOpen: Dispatch<SetStateAction<boolean>>
  isCollectionExpanded: (collectionId: string) => boolean
  toggleCollectionExpanded: (collectionId: string) => void
  onAddRoute: () => void
  /** Gen API: opens Import & env tab. Query API: opens Import & env in main area. */
  onOpenImportExportTab?: () => void
}

export function AppSidebar({
  tree,
  setTree,
  uiMode,
  onUiModeChange,
  running,
  electron,
  defaultRequestMethod,
  workspaceRenameOpen,
  setWorkspaceRenameOpen,
  isCollectionExpanded,
  toggleCollectionExpanded,
  onAddRoute,
  onOpenImportExportTab,
}: AppSidebarProps) {
  const selectedWorkspace = tree.workspaces.find((w) => w.id === tree.selectedWorkspaceId)
  const isGenApi = uiMode === 'genApi'

  return (
    <aside className="pm-sidebar" aria-label="Workspace and mock routes">
      <div className="pm-sidebar__brand">
        <a
          className="pm-sidebar__logo-link"
          href={CODEFRYDEV_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="CodeFryDev — codefrydev.in"
        >
          <span className="pm-sidebar__logo-mark">
            <img
              src="/codefrydev-icon.svg"
              width={28}
              height={28}
              alt=""
              decoding="async"
            />
          </span>
        </a>
        <div className="pm-sidebar__brand-text">
          <span className="pm-sidebar__title">Random API</span>
          <span className="pm-sidebar__subtitle">codefrydev.in</span>
        </div>
      </div>

      <div className="pm-sidebar__section pm-sidebar__section--mode">
        <span className="pm-sidebar__section-label">Mode</span>
        <div className="pm-segmented pm-segmented--stretch" role="group" aria-label="App mode">
          <button
            type="button"
            className={`pm-segmented__btn ${isGenApi ? 'pm-segmented__btn--active' : ''}`}
            onClick={() => onUiModeChange('genApi')}
            aria-pressed={isGenApi}
          >
            Gen API
          </button>
          <button
            type="button"
            className={`pm-segmented__btn ${!isGenApi ? 'pm-segmented__btn--active' : ''}`}
            onClick={() => onUiModeChange('queryApi')}
            aria-pressed={!isGenApi}
          >
            Query API
          </button>
        </div>
        {!isGenApi ? (
          <p className="pm-sidebar__mode-hint">
            HTTP client plus import/export. Use Gen API to start the mock server and edit response schemas.
          </p>
        ) : null}
      </div>

      <div className="pm-sidebar__section pm-sidebar__section--workspace">
        <div className="pm-sidebar__section-head">
          <span className="pm-sidebar__section-label">Workspace</span>
          <div className="pm-sidebar__section-actions pm-sidebar__section-actions--tight">
            <button
              type="button"
              className="pm-sidebar__icon-btn"
              onClick={() => setWorkspaceRenameOpen((o) => !o)}
              disabled={running}
              aria-expanded={workspaceRenameOpen}
              aria-label={workspaceRenameOpen ? 'Hide rename field' : 'Rename workspace'}
              title="Rename workspace"
            >
              ✎
            </button>
            <button
              type="button"
              className="pm-sidebar__icon-btn"
              onClick={() => setTree((t) => addWorkspace(t))}
              disabled={running || tree.workspaces.length >= MAX_WORKSPACES}
              title={`New workspace (max ${MAX_WORKSPACES})`}
              aria-label="Add workspace"
            >
              +
            </button>
          </div>
        </div>
        <label className="pm-sr-only" htmlFor="pm-workspace-select">
          Active workspace
        </label>
        <select
          id="pm-workspace-select"
          className="pm-sidebar__select"
          value={tree.selectedWorkspaceId}
          onChange={(e) => {
            setTree((t) => switchWorkspace(t, e.target.value))
            setWorkspaceRenameOpen(false)
          }}
          disabled={running}
        >
          {tree.workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
        {workspaceRenameOpen && (
          <input
            className="pm-sidebar__name-input pm-sidebar__name-input--rename"
            type="text"
            value={selectedWorkspace?.name ?? ''}
            onChange={(e) =>
              setTree((t) => setWorkspaceName(t, tree.selectedWorkspaceId, e.target.value))
            }
            disabled={running}
            placeholder="Workspace name"
            aria-label="Rename current workspace"
          />
        )}
      </div>

      <div className="pm-sidebar__section pm-sidebar__section--collections">
        <div className="pm-sidebar__section-head pm-sidebar__section-head--toolbar">
          <span className="pm-sidebar__section-label">Collections</span>
          <div className="pm-sidebar__toolbar" role="toolbar" aria-label="Collection actions">
            <button
              type="button"
              className="pm-sidebar__toolbar-btn"
              onClick={() => setTree((t) => addCollectionToWorkspace(t))}
              disabled={
                running ||
                !selectedWorkspace ||
                selectedWorkspace.collections.length >= MAX_COLLECTIONS_PER_WORKSPACE
              }
              title={`New folder (max ${MAX_COLLECTIONS_PER_WORKSPACE})`}
              aria-label={`New collection (max ${MAX_COLLECTIONS_PER_WORKSPACE})`}
            >
              + Collection
            </button>
            <button
              type="button"
              className="pm-sidebar__toolbar-btn"
              onClick={onAddRoute}
              disabled={running}
              title="Add mock route under the selected collection"
              aria-label="Add mock request route"
            >
              + Request
            </button>
          </div>
        </div>
        <div className="pm-sidebar__collections-scroll">
          <div className="pm-tree" role="region" aria-label="Collections and requests">
            {selectedWorkspace?.collections.map((col) => {
              const expanded = isCollectionExpanded(col.id)
              return (
                <div key={col.id} className="pm-tree__folder">
                  <div className="pm-tree__folder-row">
                    <button
                      type="button"
                      className={`pm-tree__chevron ${expanded ? 'pm-tree__chevron--expanded' : ''}`}
                      onClick={() => toggleCollectionExpanded(col.id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Collapse collection' : 'Expand collection'}
                      disabled={running}
                    >
                      <svg
                        className="pm-tree__chevron-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path fill="currentColor" d="M8 5l8 7-8 7V5z" />
                      </svg>
                    </button>
                    <span className="pm-tree__folder-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    </span>
                    <input
                      className="pm-tree__folder-name"
                      type="text"
                      value={col.name}
                      onChange={(e) =>
                        setTree((t) =>
                          setCollectionName(t, tree.selectedWorkspaceId, col.id, e.target.value),
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      disabled={running}
                      aria-label={`Collection folder: ${col.name}`}
                    />
                  </div>
                  {expanded && (
                    <ul className="pm-tree__routes" role="group">
                      {col.endpoints.map((ep, ri) => {
                        const isActive =
                          col.id === tree.selectedCollectionId && ri === tree.selectedRouteIndex
                        const routeMethod = ep.method ?? defaultRequestMethod
                        return (
                          <li key={`${col.id}-${ri}`}>
                            <button
                              type="button"
                              className={`pm-tree__request ${isActive ? 'pm-tree__request--active' : ''}`}
                              onClick={() =>
                                setTree((t) =>
                                  selectRoute(t, tree.selectedWorkspaceId, col.id, ri),
                                )
                              }
                              title={`Mock path · sends as ${routeMethod} (method in request bar)`}
                            >
                              <span
                                className={`pm-method-badge pm-method-badge--${routeMethod}`}
                                title="HTTP method for this route"
                              >
                                {routeMethod}
                              </span>
                              <span className="pm-tree__route-path">
                                {ep.path ? `/${ep.path.replace(/^\/+/, '')}` : '/'}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="pm-sidebar__footer">
        {onOpenImportExportTab ? (
          <button
            type="button"
            className="pm-sidebar__tools"
            onClick={onOpenImportExportTab}
          >
            Import / export · variables
          </button>
        ) : null}
        <a
          className="pm-sidebar__cfd"
          href={CODEFRYDEV_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="pm-sidebar__cfd-icon"
            src="/codefrydev-icon.svg"
            width={18}
            height={18}
            alt=""
          />
          <span className="pm-sidebar__cfd-text">CodeFryDev</span>
        </a>
        {electron ? (
          <span className="pm-sidebar__hint">Desktop mock server</span>
        ) : (
          <span className="pm-sidebar__hint pm-sidebar__hint--warn">Run via Electron</span>
        )}
      </div>
    </aside>
  )
}
