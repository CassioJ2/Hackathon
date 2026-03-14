import { GitHubApiError } from './errors'

/**
 * GitHub API Client
 * Todas as chamadas a API do GitHub via REST.
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

async function readGitHubError(res, fallbackMessage) {
    try {
        const data = await res.json()
        return {
            message: data?.message || fallbackMessage,
            code: data?.code || data?.error || null
        }
    } catch {
        return {
            message: fallbackMessage,
            code: null
        }
    }
}

/**
 * Lista repositorios do usuario autenticado.
 * @param {string} token
 * @returns {Promise<Array<{ id, name, fullName, owner, private, updatedAt }>>}
 */
export async function getRepos(token) {
    const res = await fetch(`${API}/user/repos?sort=updated&per_page=50`, {
        headers: headers(token)
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `getRepos failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    const repos = await res.json()
    return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        updatedAt: repo.updated_at
    }))
}

/**
 * Retorna o conteudo de um arquivo no repositorio.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<{ content: string, sha: string } | null>}
 */
export async function getFile(token, owner, repo, path) {
    const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
        headers: headers(token)
    })

    if (res.status === 404) {
        return null
    }

    if (!res.ok) {
        const error = await readGitHubError(res, `getFile failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    const data = await res.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return { content, sha: data.sha }
}

/**
 * Cria ou atualiza um arquivo no repositorio e gera um commit.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} content
 * @param {string|null} sha
 * @param {string} message
 * @returns {Promise<{ sha: string }>}
 */
export async function updateFile(token, owner, repo, path, content, sha, message) {
    const body = {
        message,
        content: Buffer.from(content, 'utf-8').toString('base64')
    }

    if (sha) {
        body.sha = sha
    }

    const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `updateFile failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    const data = await res.json()
    return { sha: data.content.sha }
}

/**
 * Retorna apenas o SHA atual de um arquivo.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<string|null>}
 */
export async function getFileSha(token, owner, repo, path) {
    const file = await getFile(token, owner, repo, path)
    return file ? file.sha : null
}
