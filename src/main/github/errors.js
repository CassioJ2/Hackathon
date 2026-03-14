export class GitHubApiError extends Error {
    constructor(message, { status, code } = {}) {
        super(message)
        this.name = 'GitHubApiError'
        this.status = status ?? null
        this.code = code ?? null
    }
}
