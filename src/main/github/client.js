import { GitHubApiError } from './errors'
import { fetchWithTimeout } from './http'

/**
 * GitHub API Client
 * Todas as chamadas a API do GitHub via REST.
 */

const API = 'https://api.github.com'
const userProfileCache = new Map()

function withQuery(url, params = {}) {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
        if (value) {
            searchParams.set(key, value)
        }
    }

    const query = searchParams.toString()
    return query ? `${url}?${query}` : url
}

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

async function getUserProfile(token, login) {
    const cacheKey = `${token}:${login}`
    if (userProfileCache.has(cacheKey)) {
        return userProfileCache.get(cacheKey)
    }

    const res = await fetchWithTimeout(`${API}/users/${login}`, {
        headers: headers(token)
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `getUserProfile failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    const profile = await res.json()
    userProfileCache.set(cacheKey, profile)
    return profile
}

/**
 * Lista repositorios do usuario autenticado.
 * @param {string} token
 * @returns {Promise<Array<{ id, name, fullName, owner, private, updatedAt }>>}
 */
export async function getRepos(token) {
    const res = await fetchWithTimeout(`${API}/user/repos?sort=updated&per_page=50`, {
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
 * Lista colaboradores do repositorio.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array<{ id: number, login: string, name: string, avatarUrl: string, profileUrl: string }>>}
 */
export async function getRepoCollaborators(token, owner, repo) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/collaborators?per_page=100`, {
        headers: headers(token)
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `getRepoCollaborators failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    const collaborators = await res.json()

    const enrichedCollaborators = await Promise.all(
        collaborators.map(async (user) => {
            try {
                const profile = await getUserProfile(token, user.login)
                return {
                    id: user.id,
                    login: user.login,
                    name: profile.name || '',
                    avatarUrl: user.avatar_url,
                    profileUrl: user.html_url
                }
            } catch {
                return {
                    id: user.id,
                    login: user.login,
                    name: '',
                    avatarUrl: user.avatar_url,
                    profileUrl: user.html_url
                }
            }
        })
    )

    return enrichedCollaborators
}

export async function getRepoDetails(token, owner, repo) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}`, {
        headers: headers(token)
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `getRepoDetails failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return res.json()
}

async function getBranchRef(token, owner, repo, branch) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, {
        headers: headers(token)
    })

    if (res.status === 404) {
        return null
    }

    if (!res.ok) {
        const error = await readGitHubError(res, `getBranchRef failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return res.json()
}

async function createTree(token, owner, repo, entries) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
            tree: entries
        })
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `createTree failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return res.json()
}

async function createCommit(token, owner, repo, message, treeSha, parentSha) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
            message,
            tree: treeSha,
            parents: parentSha ? [parentSha] : []
        })
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `createCommit failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return res.json()
}

async function updateBranchRef(token, owner, repo, branch, commitSha) {
    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: 'PATCH',
        headers: headers(token),
        body: JSON.stringify({
            sha: commitSha,
            force: true
        })
    })

    if (!res.ok) {
        const error = await readGitHubError(res, `updateBranchRef failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return res.json()
}

export async function ensureBranch(token, owner, repo, branch) {
    if (!branch) {
        return null
    }

    const existingBranch = await getBranchRef(token, owner, repo, branch)
    if (existingBranch) {
        return { created: false, branch }
    }

    const repoDetails = await getRepoDetails(token, owner, repo)
    const defaultBranch = repoDetails.default_branch
    const defaultBranchRef = await getBranchRef(token, owner, repo, defaultBranch)

    if (!defaultBranchRef?.object?.sha) {
        throw new Error(`Could not resolve default branch ${defaultBranch} for ${owner}/${repo}`)
    }

    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: defaultBranchRef.object.sha
        })
    })

    if (res.status === 422) {
        return { created: false, branch }
    }

    if (!res.ok) {
        const error = await readGitHubError(res, `ensureBranch failed: ${res.status}`)
        throw new GitHubApiError(error.message, { status: res.status, code: error.code })
    }

    return { created: true, branch, baseBranch: defaultBranch }
}

export async function replaceBranchWithSnapshot(token, owner, repo, branch, files, message = 'chore: sync tasks branch') {
    const branchRef = await getBranchRef(token, owner, repo, branch)

    if (!branchRef?.object?.sha) {
        throw new Error(`Could not resolve branch ${branch} for ${owner}/${repo}`)
    }

    const tree = await createTree(
        token,
        owner,
        repo,
        files.map((file) => ({
            path: file.path,
            mode: '100644',
            type: 'blob',
            content: file.content
        }))
    )

    const commit = await createCommit(token, owner, repo, message, tree.sha, branchRef.object.sha)
    await updateBranchRef(token, owner, repo, branch, commit.sha)

    return {
        commitSha: commit.sha,
        treeSha: tree.sha
    }
}

/**
 * Retorna o conteudo de um arquivo no repositorio.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<{ content: string, sha: string } | null>}
 */
export async function getFile(token, owner, repo, path, options = {}) {
    const { ref = null } = options
    const res = await fetchWithTimeout(withQuery(`${API}/repos/${owner}/${repo}/contents/${path}`, { ref }), {
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
export async function updateFile(token, owner, repo, path, content, sha, message, options = {}) {
    const { branch = null } = options
    const body = {
        message,
        content: Buffer.from(content, 'utf-8').toString('base64')
    }

    if (sha) {
        body.sha = sha
    }

    if (branch) {
        body.branch = branch
    }

    const res = await fetchWithTimeout(`${API}/repos/${owner}/${repo}/contents/${path}`, {
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
export async function getFileSha(token, owner, repo, path, options = {}) {
    const file = await getFile(token, owner, repo, path, options)
    return file ? file.sha : null
}
