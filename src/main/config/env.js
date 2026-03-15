import { existsSync, readFileSync } from 'fs'
import { dirname, join, parse, resolve } from 'path'

function stripWrappingQuotes(value) {
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1)
    }

    return value
}

function collectParentDirs(startDir) {
    const dirs = []
    let current = resolve(startDir)

    while (true) {
        dirs.push(current)

        const parent = dirname(current)
        if (parent === current || parent === parse(current).root) {
            if (parent !== current) {
                dirs.push(parent)
            }
            break
        }

        current = parent
    }

    return dirs
}

function getEnvCandidatePaths() {
    const candidates = new Set()
    const baseDirs = new Set([
        process.cwd(),
        dirname(process.execPath),
        __dirname
    ])

    for (const baseDir of baseDirs) {
        for (const dir of collectParentDirs(baseDir)) {
            candidates.add(join(dir, '.env'))
        }
    }

    return [...candidates]
}

/**
 * Carrega variaveis de um arquivo .env no processo principal sem depender de libs externas.
 * Variaveis ja definidas no ambiente nao sao sobrescritas.
 */
export function loadEnvFile() {
    const envPath = getEnvCandidatePaths().find((candidate) => existsSync(candidate))

    if (!envPath) {
        return null
    }

    const contents = readFileSync(envPath, 'utf-8')

    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim()

        if (!line || line.startsWith('#')) {
            continue
        }

        const separatorIndex = line.indexOf('=')
        if (separatorIndex === -1) {
            continue
        }

        const key = line.slice(0, separatorIndex).trim()
        const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())

        if (!key || process.env[key] !== undefined) {
            continue
        }

        process.env[key] = value
    }

    return envPath
}
