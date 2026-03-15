import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

function sanitizeSegment(value) {
    return String(value).replace(/[^a-zA-Z0-9._-]/g, '_')
}

function getCacheDir() {
    return join(app.getPath('userData'), 'tasks-cache')
}

function getCachePath(owner, repo) {
    const fileName = `${sanitizeSegment(owner)}__${sanitizeSegment(repo)}__tasks.md`
    return join(getCacheDir(), fileName)
}

export async function readLocalTasksMarkdown(owner, repo) {
    try {
        return await readFile(getCachePath(owner, repo), 'utf-8')
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

export async function writeLocalTasksMarkdown(owner, repo, markdown) {
    await mkdir(getCacheDir(), { recursive: true })
    await writeFile(getCachePath(owner, repo), markdown, 'utf-8')
}
