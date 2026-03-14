import Store from 'electron-store'

const store = new Store({
    name: 'codesprnt-state',
    defaults: {
        token: null,
        activeRepo: null,   // { owner, repo, name }
        tasksSha: null      // SHA do último tasks.md lido
    }
})

export default store
