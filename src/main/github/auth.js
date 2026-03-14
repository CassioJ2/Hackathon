/**
 * GitHub Device Flow Authentication
 *
 * Flow:
 * 1. POST para /login/device/code → recebe device_code + user_code
 * 2. Usuário acessa https://github.com/login/device e digita user_code
 * 3. Fazemos polling em /login/oauth/access_token até receber o token
 */

const GITHUB_API = 'https://github.com'

/**
 * Inicia o Device Flow e retorna os dados para exibir ao usuário.
 * @param {string} clientId - GitHub App Client ID
 * @returns {{ device_code, user_code, verification_uri, expires_in, interval }}
 */
export async function startDeviceFlow(clientId) {
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
 * Faz polling até o usuário autorizar e retorna o access_token.
 * @param {string} clientId
 * @param {string} deviceCode
 * @param {number} intervalSeconds - intervalo sugerido pelo GitHub (default 5s)
 * @returns {string} access_token
 */
export async function pollForToken(clientId, deviceCode, intervalSeconds = 5) {
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

                const data = await res.json()

                if (data.access_token) {
                    clearInterval(poll)
                    console.log('[auth] Token received successfully')
                    resolve(data.access_token)
                } else if (data.error === 'authorization_pending') {
                    // Usuário ainda não autorizou — continua polling
                } else if (data.error === 'slow_down') {
                    // GitHub pediu pra esperar mais — aumenta o intervalo
                    clearInterval(poll)
                    setTimeout(() => {
                        pollForToken(clientId, deviceCode, intervalSeconds + 5)
                            .then(resolve)
                            .catch(reject)
                    }, (intervalSeconds + 5) * 1000)
                } else if (data.error === 'expired_token') {
                    clearInterval(poll)
                    reject(new Error('Device code expired. Please try again.'))
                } else {
                    clearInterval(poll)
                    reject(new Error(`Auth error: ${data.error}`))
                }
            } catch (err) {
                clearInterval(poll)
                reject(err)
            }
        }, intervalSeconds * 1000)
    })
}
