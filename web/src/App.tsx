import './App.css'
import { useRandomApiApp } from './hooks/useRandomApiApp'
import { AppSidebar } from './components/AppSidebar'
import { AppTitlebar } from './components/AppTitlebar'
import { AppBanners } from './components/AppBanners'
import { ServerStatusBar } from './components/ServerStatusBar'
import { RequestSection } from './components/RequestSection'
import { RequestCodeSamples } from './components/RequestCodeSamples'
import { ResponseDefinitionSection } from './components/ResponseDefinitionSection'
import { OverviewSection } from './components/OverviewSection'
import { ResponseViewer } from './components/ResponseViewer'

function App() {
  const app = useRandomApiApp()

  return (
    <div className="pm-app">
      <AppSidebar
        tree={app.tree}
        setTree={app.setTree}
        running={app.running}
        electron={app.electron}
        requestMethod={app.requestMethod}
        workspaceRenameOpen={app.workspaceRenameOpen}
        setWorkspaceRenameOpen={app.setWorkspaceRenameOpen}
        isCollectionExpanded={app.isCollectionExpanded}
        toggleCollectionExpanded={app.toggleCollectionExpanded}
        onAddRoute={app.addRoute}
      />

      <main className="pm-main">
        <AppTitlebar
          selectedWorkspace={app.selectedWorkspace}
          selectedCollection={app.selectedCollection}
          selected={app.selected}
        />

        <AppBanners
          electron={app.electron}
          persistBannerMessage={app.persistBannerMessage}
          persistBannerDismissed={app.persistBannerDismissed}
          onDismissPersistBanner={() => app.setPersistBannerDismissed(true)}
        />

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
        />

        <RequestSection
          running={app.running}
          electron={app.electron}
          requestMethod={app.requestMethod}
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

        <div className="pm-tabs">
          <button
            type="button"
            className={`pm-tab ${app.schemaTab === 'schema' ? 'pm-tab--active' : ''}`}
            onClick={() => app.setSchemaTab('schema')}
          >
            Response
          </button>
          <button
            type="button"
            className={`pm-tab ${app.schemaTab === 'params' ? 'pm-tab--active' : ''}`}
            onClick={() => app.setSchemaTab('params')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`pm-tab ${app.schemaTab === 'code' ? 'pm-tab--active' : ''}`}
            onClick={() => app.setSchemaTab('code')}
          >
            Code
          </button>
        </div>

        {app.schemaTab === 'schema' && app.selected && (
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
          />
        )}

        {app.schemaTab === 'params' && (
          <OverviewSection electron={app.electron} persistDisabled={app.persistDisabled} />
        )}

        {app.schemaTab === 'code' && <RequestCodeSamples spec={app.requestCodeSpec} />}

        <ResponseViewer
          fetchError={app.fetchError}
          preview={app.preview}
          rawBody={app.rawBody}
          bodyView={app.bodyView}
          responseMeta={app.responseMeta}
          onBodyViewChange={app.setBodyView}
        />
      </main>
    </div>
  )
}

export default App
