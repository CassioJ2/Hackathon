import { net } from 'electron'

const DEFAULT_TIMEOUT_MS = 20_000

export function formatFetchError(context, error) {
    const cause = error?.cause
    const details = [
        error?.message,
        error?.code,
        cause?.code,
        cause?.errno,
        cause?.syscall,
        cause?.hostname
    ].filter(Boolean)

    return `${context}: ${details.join(' | ') || 'unknown network error'}`
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const requestOptions = {
        ...options,
        signal: AbortSignal.timeout(timeoutMs)
    }

    try {
        if (typeof net.fetch === 'function') {
            return await net.fetch(url, requestOptions)
        }

        return await fetch(url, requestOptions)
    } catch (error) {
        throw new Error(formatFetchError(`Request failed for ${url}`, error))
    }
}
