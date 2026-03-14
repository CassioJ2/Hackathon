/**
 * GitHub Device Flow Authentication
 *
 * Flow:
 * 1. POST para /login/device/code e recebe device_code + user_code
 * 2. Usuario acessa https://github.com/login/device e informa o user_code
 * 3. Fazemos polling em /login/oauth/access_token ate receber o token
 */

const GITHUB_API = 'https://github.com'

function ensureClientId(clientId) {
    if (!clientId?.trim()) {
        throw new Error('Missing GitHub Client ID')
    }
}

/**
 * Inicia o Device Flow e retorna os dados para exibir ao usuario.
 * @param {string} clientId
 * @returns {{ device_code, user_code, verification_uri, expires_in, interval }}
 */
export async function startDeviceFlow(clientId) {
    ensureClientId(clientId)

    const res = await fetch(`${GITHUB_API}/login/device/code`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            scope: 'repo user'
        })
    })

    if (!res.ok) {
        throw new Error(`Device flow init failed: ${res.status}`)
    }

    return res.json()
}

/**
 * Faz polling ate o usuario autorizar e retorna o access_token.
 * @param {string} clientId
 * @param {string} deviceCode
 * @param {number} intervalSeconds
 * @returns {Promise<string>}
 */
export async function pollForToken(clientId, deviceCode, intervalSeconds = 5) {
    ensureClientId(clientId)

    return new Promise((resolve, reject) => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch(`${GITHUB_API}/login/oauth/access_token`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_id: clientId,
                        device_code: deviceCode,
                        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                    })
                })

                if (!res.ok) {
                    clearInterval(poll)
                    reject(new Error(`Token polling failed: ${res.status}`))
                    return
                }

                const data = await res.json()

                if (data.access_token) {
                    clearInterval(poll)
                    console.log('[auth] Token received successfully')
                    resolve(data.access_token)
                    return
                }

                if (data.error === 'authorization_pending') {
                    return
                }

                if (data.error === 'slow_down') {
                    clearInterval(poll)
                    setTimeout(() => {
                        pollForToken(clientId, deviceCode, intervalSeconds + 5)
                            .then(resolve)
                            .catch(reject)
                    }, (intervalSeconds + 5) * 1000)
                    return
                }

                if (data.error === 'expired_token') {
                    clearInterval(poll)
                    reject(new Error('Device code expired. Please try again.'))
                    return
                }

                clearInterval(poll)
                reject(new Error(`Auth error: ${data.error || 'unknown_error'}`))
            } catch (err) {
                clearInterval(poll)
                reject(err)
            }
        }, intervalSeconds * 1000)
    })
}
