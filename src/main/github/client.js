/**
 * GitHub API Client
 * Todas as chamadas à API do GitHub via REST
 */

const API = 'https://api.github.com'

function headers(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
    }
}

/**
 * Lista repositórios do usuário autenticado.
 * @param {string} token
 * @returns {Array<{ id, name, full_name, owner, private }>}
 */
export async function getRepos(token) {
    const res = await fetch(`${API}/user/repos?sort=updated&per_page=50`, {
        headers: headers(token)
    })
    if (!res.ok) throw new Error(`getRepos failed: ${res.status}`)
    const repos = await res.json()
    return repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        private: r.private,
        updatedAt: r.updated_at
    }))
}

/**
 * Retorna o conteúdo de um arquivo no repositório.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path - ex: 'tasks.md'
 * @returns {{ content: string, sha: string } | null}
 */
export async function getFile(token, owner, repo, path) {
    const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
        headers: headers(token)
    })

    if (res.status === 404) return null
    if (!res.ok) throw new Error(`getFile failed: ${res.status}`)

    const data = await res.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return { content, sha: data.sha }
}

/**
 * Cria ou atualiza um arquivo no repositório (cria um commit).
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} content - conteúdo em texto puro (será convertido para base64)
 * @param {string|null} sha - SHA atual do arquivo (null se for criação)
 * @param {string} message - mensagem do commit
 */
export async function updateFile(token, owner, repo, path, content, sha, message) {
    const body = {
        message,
        content: Buffer.from(content, 'utf-8').toString('base64')
    }
    if (sha) body.sha = sha

    const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(`updateFile failed: ${res.status} — ${err.message}`)
    }

    const data = await res.json()
    return { sha: data.content.sha }
}

/**
 * Retorna apenas o SHA atual de um arquivo (usado pelo poller para detectar mudanças).
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {string|null} sha
 */
export async function getFileSha(token, owner, repo, path) {
    const file = await getFile(token, owner, repo, path)
    return file ? file.sha : null
}
