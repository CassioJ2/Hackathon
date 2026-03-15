import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

export function getTasksPath(localPath) {
    return join(localPath, 'tasks.md')
}

async function readGitConfig(localPath) {
    const gitEntryPath = join(localPath, '.git')
    const gitEntryStats = await stat(gitEntryPath)

    if (gitEntryStats.isDirectory()) {
        return readFile(join(gitEntryPath, 'config'), 'utf-8')
    }

    const gitEntry = await readFile(gitEntryPath, 'utf-8')
    const gitDirMatch = gitEntry.match(/^gitdir:\s*(.+)$/im)

    if (gitDirMatch) {
        const gitDir = gitDirMatch[1].trim()
        const resolvedGitDir = isAbsolute(gitDir)
            ? gitDir
            : resolve(dirname(gitEntryPath), gitDir)

        return readFile(join(resolvedGitDir, 'config'), 'utf-8')
    }

    return readFile(join(gitEntryPath, 'config'), 'utf-8')
}

function extractGithubRepo(remoteUrl) {
    const match = remoteUrl.match(/github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s]+?)(?:\.git)?$/i)

    if (!match?.groups) {
        return null
    }

    return {
        owner: match.groups.owner,
        repo: match.groups.repo
    }
}

export async function validateLocalRepoPath(localPath, owner, repo) {
    if (!localPath) {
        return {
            valid: false,
            reason: 'missing_path',
            remoteUrl: null,
            detectedRepo: null
        }
    }

    try {
        const config = await readGitConfig(localPath)
        const remoteMatch = config.match(/\[remote\s+"origin"\][\s\S]*?url\s*=\s*(.+)/i)
        const remoteUrl = remoteMatch?.[1]?.trim() || null

        if (!remoteUrl) {
            return {
                valid: false,
                reason: 'missing_origin',
                remoteUrl: null,
                detectedRepo: null
            }
        }

        const detectedRepo = extractGithubRepo(remoteUrl)

        if (!detectedRepo) {
            return {
                valid: false,
                reason: 'unsupported_remote',
                remoteUrl,
                detectedRepo: null
            }
        }

        const isValid =
            detectedRepo.owner.toLowerCase() === owner.toLowerCase() &&
            detectedRepo.repo.toLowerCase() === repo.toLowerCase()

        return {
            valid: isValid,
            reason: isValid ? null : 'repo_mismatch',
            remoteUrl,
            detectedRepo
        }
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return {
                valid: false,
                reason: 'missing_git',
                remoteUrl: null,
                detectedRepo: null
            }
        }

        throw error
    }
}

export async function readRepoTasksMarkdown(localPath) {
    if (!localPath) {
        return null
    }

    try {
        return await readFile(getTasksPath(localPath), 'utf-8')
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

export async function writeRepoTasksMarkdown(localPath, markdown) {
    if (!localPath) {
        return
    }

    await mkdir(localPath, { recursive: true })
    await writeFile(getTasksPath(localPath), markdown, 'utf-8')
}
