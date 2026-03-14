import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Carrega variaveis de um arquivo .env no processo principal sem depender de libs externas.
 * Variaveis ja definidas no ambiente nao sao sobrescritas.
 */
export function loadEnvFile() {
    const envPath = join(process.cwd(), '.env')

    if (!existsSync(envPath)) {
        return
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
        const value = line.slice(separatorIndex + 1).trim()

        if (!key || process.env[key] !== undefined) {
            continue
        }

        process.env[key] = value
    }
}
