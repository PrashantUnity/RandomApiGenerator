import type {
  EndpointConfig,
  HttpMethod,
  MockCollection,
  MockDataMode,
  MockWorkspace,
  PersistedAppState,
  SchemaField,
} from './types'
import { PERSIST_STATE_VERSION } from './types'
import { schemaToFormattedSampleJson } from './schemaSync'

export const MAX_WORKSPACES = 10
export const MAX_COLLECTIONS_PER_WORKSPACE = 20
export const MAX_ENVIRONMENTS = 15

const defaultSchema = [{ name: 'id', type: 'integer' as const }]

function newEndpoint(
  pathSuffix: string,
  mockDataMode: MockDataMode = 'seeded',
  method: HttpMethod = 'GET',
): EndpointConfig {
  const schema = [...defaultSchema]
  return {
    path: pathSuffix,
    method,
    schema,
    sampleJson: schemaToFormattedSampleJson(schema, mockDataMode),
  }
}

export function createDefaultPersistedState(): PersistedAppState {
  const wsId = crypto.randomUUID()
  const colId = crypto.randomUUID()
  const envId = crypto.randomUUID()
  const ep = newEndpoint('users', 'seeded', 'GET')
  ep.schema = [
    { name: 'id', type: 'integer' },
    { name: 'name', type: 'name' },
    { name: 'email', type: 'email' },
    { name: 'avatar', type: 'picsum' },
  ]
  ep.sampleJson = schemaToFormattedSampleJson(ep.schema, 'seeded')
  return {
    version: PERSIST_STATE_VERSION,
    uiMode: 'genApi',
    workspaces: [
      {
        id: wsId,
        name: 'Default',
        collections: [
          {
            id: colId,
            name: 'Default',
            endpoints: [ep],
          },
        ],
      },
    ],
    selectedWorkspaceId: wsId,
    selectedCollectionId: colId,
    selectedRouteIndex: 0,
    requestMethod: 'GET',
    sampleCount: '3',
    mockDataMode: 'seeded',
    environments: [{ id: envId, name: 'Default', variables: {} }],
    selectedEnvironmentId: envId,
  }
}

/** All mock routes in the active workspace (order: collections then endpoints). */
export function flattenWorkspaceEndpoints(
  workspaces: MockWorkspace[],
  workspaceId: string,
): EndpointConfig[] {
  const ws = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]
  if (!ws) return []
  const out: EndpointConfig[] = []
  for (const col of ws.collections) {
    for (const ep of col.endpoints) {
      out.push(ep)
    }
  }
  return out
}

export function getSelectedEndpoint(
  state: Pick<PersistedAppState, 'workspaces' | 'selectedWorkspaceId' | 'selectedCollectionId' | 'selectedRouteIndex'>,
): EndpointConfig | undefined {
  const ws = state.workspaces.find((w) => w.id === state.selectedWorkspaceId)
  const col = ws?.collections.find((c) => c.id === state.selectedCollectionId)
  return col?.endpoints[state.selectedRouteIndex]
}

export function clampRouteIndex(routeIndex: number, endpointsLength: number): number {
  if (endpointsLength <= 0) return 0
  return Math.min(Math.max(0, Math.floor(routeIndex)), endpointsLength - 1)
}

export function updateSelectedEndpoint(
  tree: PersistedAppState,
  fn: (ep: EndpointConfig) => EndpointConfig,
): PersistedAppState {
  const { selectedWorkspaceId, selectedCollectionId, selectedRouteIndex } = tree
  return {
    ...tree,
    workspaces: tree.workspaces.map((ws) =>
      ws.id !== selectedWorkspaceId
        ? ws
        : {
            ...ws,
            collections: ws.collections.map((col) =>
              col.id !== selectedCollectionId
                ? col
                : {
                    ...col,
                    endpoints: col.endpoints.map((ep, i) =>
                      i === selectedRouteIndex ? fn(ep) : ep,
                    ),
                  },
            ),
          },
    ),
  }
}

function newRoute(
  pathSuffix: string,
  mockDataMode: MockDataMode = 'seeded',
  method: HttpMethod = 'GET',
): EndpointConfig {
  const schema: SchemaField[] = [{ name: 'id', type: 'integer' }]
  return {
    path: pathSuffix,
    method,
    schema,
    sampleJson: schemaToFormattedSampleJson(schema, mockDataMode),
  }
}

export function addRouteToSelection(tree: PersistedAppState): PersistedAppState {
  const ws = tree.workspaces.find((w) => w.id === tree.selectedWorkspaceId)
  const col = ws?.collections.find((c) => c.id === tree.selectedCollectionId)
  if (!ws || !col) return tree
  const n = col.endpoints.length + 1
  const nextEp = newRoute(`resource_${n}`, tree.mockDataMode ?? 'seeded', tree.requestMethod)
  const nextCol: MockCollection = {
    ...col,
    endpoints: [...col.endpoints, nextEp],
  }
  return {
    ...tree,
    selectedRouteIndex: nextCol.endpoints.length - 1,
    workspaces: tree.workspaces.map((w) =>
      w.id !== ws.id
        ? w
        : {
            ...w,
            collections: w.collections.map((c) => (c.id === col.id ? nextCol : c)),
          },
    ),
  }
}

export function addCollectionToWorkspace(tree: PersistedAppState): PersistedAppState {
  const ws = tree.workspaces.find((w) => w.id === tree.selectedWorkspaceId)
  if (!ws || ws.collections.length >= MAX_COLLECTIONS_PER_WORKSPACE) return tree
  const colId = crypto.randomUUID()
  const ep = newRoute('resource_1', tree.mockDataMode ?? 'seeded', tree.requestMethod)
  const newCol: MockCollection = {
    id: colId,
    name: `Collection ${ws.collections.length + 1}`,
    endpoints: [ep],
  }
  return {
    ...tree,
    selectedCollectionId: colId,
    selectedRouteIndex: 0,
    workspaces: tree.workspaces.map((w) =>
      w.id !== ws.id ? w : { ...w, collections: [...w.collections, newCol] },
    ),
  }
}

export function addWorkspace(tree: PersistedAppState): PersistedAppState {
  if (tree.workspaces.length >= MAX_WORKSPACES) return tree
  const wsId = crypto.randomUUID()
  const colId = crypto.randomUUID()
  const ep = newRoute('users', tree.mockDataMode ?? 'seeded', tree.requestMethod)
  return {
    ...tree,
    selectedWorkspaceId: wsId,
    selectedCollectionId: colId,
    selectedRouteIndex: 0,
    workspaces: [
      ...tree.workspaces,
      {
        id: wsId,
        name: `Workspace ${tree.workspaces.length + 1}`,
        collections: [{ id: colId, name: 'Default', endpoints: [ep] }],
      },
    ],
  }
}

export function removeSelectedRoute(tree: PersistedAppState): PersistedAppState {
  const flat = flattenWorkspaceEndpoints(tree.workspaces, tree.selectedWorkspaceId)
  if (flat.length <= 1) return tree
  const wsId = tree.selectedWorkspaceId
  const colId = tree.selectedCollectionId
  const ri = tree.selectedRouteIndex

  const workspaces = tree.workspaces.map((ws) => {
    if (ws.id !== wsId) return ws
    const collections = ws.collections
      .map((col) => {
        if (col.id !== colId) return col
        const endpoints = col.endpoints.filter((_, i) => i !== ri)
        return { ...col, endpoints }
      })
      .filter((col) => col.endpoints.length > 0)
    return {
      ...ws,
      collections: collections.length
        ? collections
        : [makeSingletonCollection(tree.mockDataMode ?? 'seeded')],
    }
  })

  const first = findFirstRouteSelection(workspaces, wsId)
  if (!first) return tree
  return {
    ...tree,
    workspaces,
    selectedWorkspaceId: first.workspaceId,
    selectedCollectionId: first.collectionId,
    selectedRouteIndex: first.routeIndex,
  }
}

function makeSingletonCollection(mockDataMode: MockDataMode = 'seeded'): MockCollection {
  const colId = crypto.randomUUID()
  const ep = newRoute('users', mockDataMode, 'GET')
  return { id: colId, name: 'Default', endpoints: [ep] }
}

function findFirstRouteSelection(
  workspaces: MockWorkspace[],
  preferredWsId: string,
): {
  workspaceId: string
  collectionId: string
  routeIndex: number
} | null {
  const ws =
    workspaces.find((w) => w.id === preferredWsId) ?? workspaces[0]
  if (!ws) return null
  for (const col of ws.collections) {
    if (col.endpoints.length > 0) {
      return { workspaceId: ws.id, collectionId: col.id, routeIndex: 0 }
    }
  }
  return null
}

export function selectRoute(
  tree: PersistedAppState,
  workspaceId: string,
  collectionId: string,
  routeIndex: number,
): PersistedAppState {
  const ws = tree.workspaces.find((w) => w.id === workspaceId)
  const col = ws?.collections.find((c) => c.id === collectionId)
  if (!ws || !col) return tree
  return {
    ...tree,
    selectedWorkspaceId: workspaceId,
    selectedCollectionId: collectionId,
    selectedRouteIndex: clampRouteIndex(routeIndex, col.endpoints.length),
  }
}

export function switchWorkspace(tree: PersistedAppState, workspaceId: string): PersistedAppState {
  const ws = tree.workspaces.find((w) => w.id === workspaceId)
  if (!ws || ws.collections.length === 0) return tree
  const col = ws.collections.find((c) => c.endpoints.length > 0) ?? ws.collections[0]
  if (!col || col.endpoints.length === 0) return tree
  return {
    ...tree,
    selectedWorkspaceId: workspaceId,
    selectedCollectionId: col.id,
    selectedRouteIndex: 0,
  }
}

export function setWorkspaceName(tree: PersistedAppState, workspaceId: string, name: string): PersistedAppState {
  return {
    ...tree,
    workspaces: tree.workspaces.map((w) => (w.id === workspaceId ? { ...w, name } : w)),
  }
}

export function setCollectionName(
  tree: PersistedAppState,
  workspaceId: string,
  collectionId: string,
  name: string,
): PersistedAppState {
  return {
    ...tree,
    workspaces: tree.workspaces.map((ws) =>
      ws.id !== workspaceId
        ? ws
        : {
            ...ws,
            collections: ws.collections.map((c) =>
              c.id === collectionId ? { ...c, name } : c,
            ),
          },
    ),
  }
}

export function addEnvironment(tree: PersistedAppState): PersistedAppState {
  if (tree.environments.length >= MAX_ENVIRONMENTS) return tree
  const id = crypto.randomUUID()
  return {
    ...tree,
    environments: [
      ...tree.environments,
      { id, name: `Environment ${tree.environments.length + 1}`, variables: {} },
    ],
    selectedEnvironmentId: id,
  }
}

export function setSelectedEnvironment(tree: PersistedAppState, environmentId: string): PersistedAppState {
  if (!tree.environments.some((e) => e.id === environmentId)) return tree
  return { ...tree, selectedEnvironmentId: environmentId }
}

export function setEnvironmentNameForId(
  tree: PersistedAppState,
  environmentId: string,
  name: string,
): PersistedAppState {
  return {
    ...tree,
    environments: tree.environments.map((e) => (e.id === environmentId ? { ...e, name } : e)),
  }
}

export function setEnvironmentVariable(
  tree: PersistedAppState,
  environmentId: string,
  key: string,
  value: string,
): PersistedAppState {
  return {
    ...tree,
    environments: tree.environments.map((e) =>
      e.id === environmentId ? { ...e, variables: { ...e.variables, [key]: value } } : e,
    ),
  }
}
