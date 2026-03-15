import Store from 'electron-store'

const store = new Store({
    name: 'codesprnt-state',
    defaults: {
        appVersion: null,
        token: null,
        activeRepo: null,
        tasksSha: null,
        remoteFileShas: {},
        dirtyRepos: {}
    }
})

export default store

export function resetPersistedSessionState() {
    store.set('token', null)
    store.set('activeRepo', null)
    store.set('tasksSha', null)
    store.set('remoteFileShas', {})
    store.set('dirtyRepos', {})
}

export function getStoredAppVersion() {
    return store.get('appVersion') || null
}

export function setStoredAppVersion(version) {
    store.set('appVersion', version || null)
}
