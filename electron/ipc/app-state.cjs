const { randomUUID } = require('crypto');
const { ipcMain } = require('electron');
const { loadState, saveState } = require('../db.cjs');
const state = require('../state.cjs');
const {
  ALLOWED_METHODS,
  PERSIST_STATE_VERSION,
  MAX_WORKSPACES,
  MAX_COLLECTIONS_PER_WORKSPACE,
} = require('../mock-api/constants.cjs');
const { validateEndpointsConfig } = require('../mock-api/validation.cjs');

function normalizeSampleCountString(raw) {
  const scRaw = String(raw ?? '3').trim().slice(0, 8);
  if (!/^\d+$/.test(scRaw)) return '3';
  const n = parseInt(scRaw, 10);
  if (!Number.isFinite(n)) return '3';
  return String(Math.min(500, Math.max(1, n)));
}

function defaultEndpointV1() {
  return {
    path: 'users',
    schema: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'name' },
      { name: 'email', type: 'email' },
    ],
  };
}

function normalizeMockDataMode(raw) {
  return raw === 'random' ? 'random' : 'seeded';
}

function migrateDbRowToV2(row) {
  const rm = ALLOWED_METHODS.has(row.legacyRequestMethod) ? row.legacyRequestMethod : 'GET';
  const sc = normalizeSampleCountString(row.legacySampleCount);
  const raw = row.raw;

  if (Array.isArray(raw)) {
    const wsId = randomUUID();
    const colId = randomUUID();
    let eps = raw.length ? raw : [defaultEndpointV1()];
    const si = Math.min(
      Math.max(0, Math.floor(Number(row.legacySelectedIndex)) || 0),
      Math.max(0, eps.length - 1),
    );
    return {
      version: PERSIST_STATE_VERSION,
      workspaces: [
        {
          id: wsId,
          name: 'Default',
          collections: [{ id: colId, name: 'Default', endpoints: eps }],
        },
      ],
      selectedWorkspaceId: wsId,
      selectedCollectionId: colId,
      selectedRouteIndex: si,
      requestMethod: rm,
      sampleCount: sc,
      mockDataMode: 'seeded',
    };
  }

  if (raw && typeof raw === 'object' && raw.version === 2 && Array.isArray(raw.workspaces)) {
    return {
      ...raw,
      version: PERSIST_STATE_VERSION,
      requestMethod: ALLOWED_METHODS.has(raw.requestMethod) ? raw.requestMethod : rm,
      sampleCount: normalizeSampleCountString(raw.sampleCount ?? sc),
      mockDataMode: 'seeded',
    };
  }

  if (
    raw &&
    typeof raw === 'object' &&
    raw.version === PERSIST_STATE_VERSION &&
    Array.isArray(raw.workspaces)
  ) {
    return {
      ...raw,
      requestMethod: ALLOWED_METHODS.has(raw.requestMethod) ? raw.requestMethod : rm,
      sampleCount: normalizeSampleCountString(raw.sampleCount ?? sc),
      mockDataMode: normalizeMockDataMode(raw.mockDataMode),
    };
  }

  return null;
}

function flattenEndpointsFromWorkspace(workspaces, workspaceId) {
  const ws = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0];
  if (!ws) return [];
  const out = [];
  for (const col of ws.collections || []) {
    for (const ep of col.endpoints || []) {
      out.push(ep);
    }
  }
  return out;
}

function validatePersistedV2(s) {
  if (!s || s.version !== PERSIST_STATE_VERSION) {
    return { ok: false, error: 'invalid persisted state' };
  }
  if (s.mockDataMode !== 'seeded' && s.mockDataMode !== 'random') {
    return { ok: false, error: 'invalid mockDataMode' };
  }
  if (!Array.isArray(s.workspaces) || s.workspaces.length === 0) {
    return { ok: false, error: 'workspaces required' };
  }
  if (s.workspaces.length > MAX_WORKSPACES) {
    return { ok: false, error: 'too many workspaces' };
  }
  for (const ws of s.workspaces) {
    if (!ws || typeof ws.id !== 'string' || typeof ws.name !== 'string') {
      return { ok: false, error: 'invalid workspace' };
    }
    if (!Array.isArray(ws.collections) || ws.collections.length === 0) {
      return { ok: false, error: 'each workspace needs collections' };
    }
    if (ws.collections.length > MAX_COLLECTIONS_PER_WORKSPACE) {
      return { ok: false, error: 'too many collections in workspace' };
    }
  }
  return { ok: true };
}

function repairPersistedSelection(s) {
  const ws = s.workspaces.find((w) => w.id === s.selectedWorkspaceId) ?? s.workspaces[0];
  if (!ws) return null;
  const col = ws.collections.find((c) => c.id === s.selectedCollectionId) ?? ws.collections[0];
  if (!col || col.endpoints.length === 0) return null;
  const ri = Math.min(
    Math.max(0, Math.floor(Number(s.selectedRouteIndex)) || 0),
    col.endpoints.length - 1,
  );
  return {
    ...s,
    selectedWorkspaceId: ws.id,
    selectedCollectionId: col.id,
    selectedRouteIndex: ri,
  };
}

function registerAppStateHandlers() {
  ipcMain.handle('load-app-state', () => {
    if (!state.appDb) {
      if (state.persistDbUnavailable) {
        return {
          ok: true,
          data: null,
          warning:
            'Could not open the local database. Workspaces and routes are not saved between sessions.',
          persistUnavailable: true,
        };
      }
      return { ok: false, error: 'Database not available' };
    }
    try {
      const row = loadState(state.appDb);
      if (!row) {
        return { ok: true, data: null };
      }
      const migrated = migrateDbRowToV2(row);
      if (!migrated) {
        return {
          ok: true,
          data: null,
          warning: 'Saved data was invalid or corrupted; starting with defaults.',
        };
      }
      const struct = validatePersistedV2(migrated);
      if (!struct.ok) {
        return {
          ok: true,
          data: null,
          warning: 'Saved data was invalid or corrupted; starting with defaults.',
        };
      }
      const repaired = repairPersistedSelection(migrated);
      if (!repaired) {
        return {
          ok: true,
          data: null,
          warning: 'Saved data was invalid or corrupted; starting with defaults.',
        };
      }
      const flat = flattenEndpointsFromWorkspace(
        repaired.workspaces,
        repaired.selectedWorkspaceId,
      );
      const v = validateEndpointsConfig(flat);
      if (!v.ok) {
        return {
          ok: true,
          data: null,
          warning: 'Saved data was invalid or corrupted; starting with defaults.',
        };
      }
      return { ok: true, data: repaired };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('save-app-state', (_event, payload) => {
    if (!state.appDb) {
      return { ok: false, error: 'Database not available' };
    }
    if (!payload || payload.version !== PERSIST_STATE_VERSION) {
      return { ok: false, error: 'invalid payload' };
    }
    const struct = validatePersistedV2(payload);
    if (!struct.ok) {
      return { ok: false, error: struct.error };
    }
    const repaired = repairPersistedSelection(payload);
    if (!repaired) {
      return { ok: false, error: 'invalid selection' };
    }
    const flat = flattenEndpointsFromWorkspace(
      repaired.workspaces,
      repaired.selectedWorkspaceId,
    );
    const v = validateEndpointsConfig(flat);
    if (!v.ok) {
      return { ok: false, error: v.error };
    }
    if (!ALLOWED_METHODS.has(repaired.requestMethod)) {
      return { ok: false, error: 'invalid request method' };
    }
    const toSave = {
      ...repaired,
      sampleCount: normalizeSampleCountString(repaired.sampleCount),
      mockDataMode: normalizeMockDataMode(repaired.mockDataMode),
    };
    try {
      saveState(state.appDb, toSave);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
}

module.exports = { registerAppStateHandlers };
