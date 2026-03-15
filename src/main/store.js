import Store from 'electron-store'

const store = new Store({
    name: 'codesprnt-state',
    defaults: {
        token: null,
        activeRepo: null,
        tasksSha: null,
        dirtyRepos: {}
    }
})

export default store
