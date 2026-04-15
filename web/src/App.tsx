import './App.css'
import { useState } from 'react'
import type { AppUiMode } from './types'
import { useRandomApiApp } from './hooks/useRandomApiApp'
import { useTabListKeyboard } from './hooks/useTabListKeyboard'
import { AppSidebar } from './components/AppSidebar'
import { AppTitlebar } from './components/AppTitlebar'
import { setSelectedEnvironment } from './workspaceModel'
import { AppBanners } from './components/AppBanners'
import { ServerStatusBar } from './components/ServerStatusBar'
import { RequestSection } from './components/RequestSection'
import { RequestCodeSamples } from './components/RequestCodeSamples'
import { ResponseDefinitionSection } from './components/ResponseDefinitionSection'
import { OverviewSection } from './components/OverviewSection'
import { ResponseViewer } from './components/ResponseViewer'
import { QueryApiWorkspace, type QueryMainTab } from './components/QueryApiWorkspace'

const GEN_EDITOR_TAB_IDS = ['gen-tab-schema', 'gen-tab-params', 'gen-tab-code'] as const

function App() {
  const app = useRandomApiApp()
  const uiMode: AppUiMode = app.tree.uiMode ?? 'genApi'
  const isGenApi = uiMode === 'genApi'
  const [queryMainTab, setQueryMainTab] = useState<QueryMainTab>('request')

  const setUiMode = (mode: AppUiMode) => {
    app.setTree((t) => {
      if (mode === 'queryApi' && t.uiMode === 'genApi') {
        queueMicrotask(() => setQueryMainTab('request'))
      }
      return { ...t, uiMode: mode }
    })
  }

  const genEditorTabIndex =
    app.schemaTab === 'schema' ? 0 : app.schemaTab === 'params' ? 1 : 2
  const { onKeyDown: onGenEditorTabsKeyDown, tabIndexFor: genEditorTabIndexFor } = useTabListKeyboard({
    tabCount: 3,
    selectedIndex: genEditorTabIndex,
    onSelectIndex: (i) =>
      app.setSchemaTab(i === 0 ? 'schema' : i === 1 ? 'params' : 'code'),
    tabIds: GEN_EDITOR_TAB_IDS,
  })

  return (
    <div className="pm-app">
      <AppSidebar
        tree={app.tree}
        setTree={app.setTree}
        uiMode={uiMode}
        onUiModeChange={setUiMode}
        running={app.running}
        electron={app.electron}
        defaultRequestMethod={app.requestMethod}
        workspaceRenameOpen={app.workspaceRenameOpen}
        setWorkspaceRenameOpen={app.setWorkspaceRenameOpen}
        isCollectionExpanded={app.isCollectionExpanded}
        toggleCollectionExpanded={app.toggleCollectionExpanded}
        onAddRoute={app.addRoute}
        onOpenImportExportTab={() => {
          if (uiMode === 'genApi') {
            app.setSchemaTab('params')
          } else {
            setQueryMainTab('import')
          }
        }}
      />

      <main className="pm-main">
        <AppTitlebar
          uiMode={uiMode}
          selectedWorkspace={app.selectedWorkspace}
          selectedCollection={app.selectedCollection}
          selected={app.selected}
          httpMethod={app.effectiveMethod}
          environmentName={app.selectedEnv?.name}
        />

        <AppBanners
          electron={app.electron}
          persistBannerMessage={app.persistBannerMessage}
          persistBannerDismissed={app.persistBannerDismissed}
          onDismissPersistBanner={() => app.setPersistBannerDismissed(true)}
        />

        {isGenApi ? (
          <>
            <ServerStatusBar
              busy={app.busy}
              running={app.running}
              server={app.server}
              electron={app.electron}
              exampleResponseError={app.exampleResponseError}
              mockDataMode={app.mockDataMode}
              onMockDataModeChange={app.setMockDataMode}
              onStart={app.handleStart}
              onStop={app.handleStop}
              environments={app.tree.environments}
              selectedEnvironmentId={app.tree.selectedEnvironmentId}
              onEnvironmentChange={(id) => app.setTree((t) => setSelectedEnvironment(t, id))}
              onOpenVariablesAndImport={() => app.setSchemaTab('params')}
            />

            <RequestSection
              running={app.running}
              electron={app.electron}
              requestMethod={app.effectiveMethod}
              displayUrl={app.displayUrl}
              placeholderUrl={app.placeholderUrl}
              sampleCount={app.sampleCount}
              showCountQuery={app.showCountQuery}
              showRequestBodyEditor={app.showRequestBodyEditor}
              requestBody={app.requestBody}
              onRequestMethodChange={app.setRequestMethod}
              onSampleCountChange={(v) => app.setTree((t) => ({ ...t, sampleCount: v }))}
              onRequestBodyChange={app.setRequestBody}
              onSend={app.sendRequest}
            />

            <div
              className="pm-tabs"
              role="tablist"
              aria-label="Editor sections"
              tabIndex={-1}
              onKeyDown={onGenEditorTabsKeyDown}
            >
              <button
                type="button"
                role="tab"
                id="gen-tab-schema"
                tabIndex={genEditorTabIndexFor(0)}
                aria-selected={app.schemaTab === 'schema'}
                className={`pm-tab ${app.schemaTab === 'schema' ? 'pm-tab--active' : ''}`}
                onClick={() => app.setSchemaTab('schema')}
              >
                Response
              </button>
              <button
                type="button"
                role="tab"
                id="gen-tab-params"
                tabIndex={genEditorTabIndexFor(1)}
                aria-selected={app.schemaTab === 'params'}
                className={`pm-tab ${app.schemaTab === 'params' ? 'pm-tab--active' : ''}`}
                onClick={() => app.setSchemaTab('params')}
              >
                Import &amp; env
              </button>
              <button
                type="button"
                role="tab"
                id="gen-tab-code"
                tabIndex={genEditorTabIndexFor(2)}
                aria-selected={app.schemaTab === 'code'}
                className={`pm-tab ${app.schemaTab === 'code' ? 'pm-tab--active' : ''}`}
                onClick={() => app.setSchemaTab('code')}
              >
                Code
              </button>
            </div>

            {app.schemaTab === 'schema' && app.selected && (
              <div role="tabpanel" id="gen-panel-schema" aria-labelledby="gen-tab-schema">
                <ResponseDefinitionSection
                  tree={app.tree}
                  selected={app.selected}
                  running={app.running}
                  flatEndpoints={app.flatEndpoints}
                  responseMode={app.responseMode}
                  exampleResponseError={app.exampleResponseError}
                  onUpdatePath={app.updateEndpointPath}
                  onRemoveRoute={app.removeRoute}
                  onSetResponseMode={app.setEndpointResponseMode}
                  onUpdateSampleJson={app.updateSampleJson}
                  onUpdateField={app.updateField}
                  onRemoveField={app.removeField}
                  onAddField={app.addField}
                  onUpdateMock={app.updateEndpointMock}
                />
              </div>
            )}

            {app.schemaTab === 'params' && (
              <div role="tabpanel" id="gen-panel-params" aria-labelledby="gen-tab-params">
                <OverviewSection
                  tree={app.tree}
                  setTree={app.setTree}
                  electron={app.electron}
                  persistDisabled={app.persistDisabled}
                  lastKnownBaseUrl={app.lastKnownBaseUrl}
                  runningBaseUrl={app.running ? app.baseUrl : ''}
                />
              </div>
            )}

            {app.schemaTab === 'code' && (
              <div role="tabpanel" id="gen-panel-code" aria-labelledby="gen-tab-code">
                <RequestCodeSamples spec={app.requestCodeSpec} />
              </div>
            )}

            <ResponseViewer
              fetchError={app.fetchError}
              preview={app.preview}
              rawBody={app.rawBody}
              bodyView={app.bodyView}
              responseMeta={app.responseMeta}
              onBodyViewChange={app.setBodyView}
              emptyVariant="genApi"
            />
          </>
        ) : (
          <QueryApiWorkspace
            electron={app.electron}
            tree={app.tree}
            setTree={app.setTree}
            persistDisabled={app.persistDisabled}
            lastKnownBaseUrl={app.lastKnownBaseUrl}
            runningBaseUrl={app.running ? app.baseUrl : ''}
            mainTab={queryMainTab}
            onMainTabChange={setQueryMainTab}
          />
        )}
      </main>
    </div>
  )
}

export default App
