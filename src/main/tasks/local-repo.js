import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

export function getTasksPath(localPath) {
    return join(localPath, 'tasks.md')
}

export function getRepoContextFilePath(localPath, fileName) {
    return join(localPath, fileName)
}

export function getPlaybookDirPath(localPath) {
    return join(localPath, 'playbook')
}

export const PLAYBOOK_FILES = [
    'playbook/README.md',
    'playbook/product.md',
    'playbook/architecture.md',
    'playbook/data-model.md',
    'playbook/sync.md',
    'playbook/ui.md',
    'playbook/playbooks.md'
]

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

export async function readRepoContextFile(localPath, fileName) {
    if (!localPath) {
        return null
    }

    try {
        return await readFile(getRepoContextFilePath(localPath, fileName), 'utf-8')
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

export async function writeRepoContextFile(localPath, fileName, content) {
    if (!localPath) {
        return
    }

    await mkdir(localPath, { recursive: true })
    await writeFile(getRepoContextFilePath(localPath, fileName), content, 'utf-8')
}

async function fileExists(path) {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

function createPlaybookFiles({ owner, repo, tasksBranch = 'tasks' }) {
    const managedFilesList = [
        '`tasks.md`',
        '`playbook/README.md`',
        '`playbook/product.md`',
        '`playbook/architecture.md`',
        '`playbook/data-model.md`',
        '`playbook/sync.md`',
        '`playbook/ui.md`',
        '`playbook/playbooks.md`'
    ].join('\n- ')

    return {
        'playbook/README.md': `# Playbook CodeSprint

Este diretorio concentra a documentacao operacional para agentes de IA, automacoes e futuras integracoes do ecossistema de tasks do CodeSprint.

## Objetivo

Explicar com clareza:

- o que o produto faz
- como a arquitetura esta organizada
- como backlog, board e sync funcionam
- quais invariantes nao podem ser quebrados
- como implementar mudancas sem adivinhar o comportamento esperado

## Leitura recomendada

1. \`playbook/product.md\`
2. \`playbook/architecture.md\`
3. \`playbook/data-model.md\`
4. \`playbook/sync.md\`
5. \`playbook/ui.md\`
6. \`playbook/playbooks.md\`

## Escopo da branch \`${tasksBranch}\`

A branch \`${tasksBranch}\` deve conter apenas:

- ${managedFilesList}

Nenhum arquivo de codigo deve ser tratado como parte da branch \`${tasksBranch}\`.
`,
        'playbook/product.md': `# Produto

## O que e o CodeSprint

CodeSprint e um app desktop em Electron com interface React para organizar trabalho tecnico em cima de um repositorio GitHub real.

O produto usa:

- \`tasks.md\` como fonte de verdade das tarefas
- uma branch dedicada \`${tasksBranch}\` para sincronizacao de planejamento
- um fluxo local-first para edicao e revisao
- backlog e board como visualizacoes da mesma base de dados

## Principio central

O backlog nao deve ficar separado do repositorio.

Por isso, o produto trata o arquivo \`tasks.md\` como uma camada de planejamento versionada, editavel tanto pelo app quanto por ferramentas externas como VS Code e agentes de IA.

## Modelo mental

Existe um unico conjunto de tasks.

Esse conjunto pode ser visto de duas formas:

- \`Backlog\`: tasks com \`status: "backlog"\`
- \`Board\`: tasks com status de execucao, como \`pending\`, \`in_progress\` e \`done\`

Backlog e board nao sao estruturas separadas. Sao filtros sobre o mesmo modelo.

## Invariantes de produto

1. \`tasks.md\` continua sendo a fonte de verdade funcional.
2. backlog continua sendo \`status: "backlog"\`.
3. board continua sendo derivado dos outros status.
4. o usuario pode editar \`tasks.md\` com o app aberto.
5. o app nunca deve sobrescrever trabalho local silenciosamente.
`,
        'playbook/architecture.md': `# Arquitetura

## Main process

Responsabilidades:

- autenticacao com GitHub
- chamadas a API do GitHub
- persistencia local
- watchers
- IPC entre Electron main e renderer

Pastas relevantes:

- \`src/main/github/\`
- \`src/main/ipc/\`
- \`src/main/tasks/\`
- \`src/main/parser/\`
- \`src/main/watcher/\`

## Renderer

Responsabilidades:

- interface visual
- backlog
- board
- modal de task
- feedback de conflito e sync

Pastas relevantes:

- \`src/renderer/pages/\`
- \`src/renderer/components/\`

## Arquivos mais importantes para implementacao

### Backend

- \`src/main/ipc/contracts.js\`
- \`src/main/ipc/handlers.js\`
- \`src/main/github/client.js\`
- \`src/main/tasks/local-repo.js\`
- \`src/main/watcher/poller.js\`
- \`src/main/parser/index.js\`

### Frontend

- \`src/renderer/pages/KanbanPage.jsx\`
- \`src/renderer/pages/RepoSelectPage.jsx\`
- \`src/renderer/components/TaskModal.jsx\`
- \`src/renderer/components/TaskCard.jsx\`

## Regra arquitetural

Se uma mudanca estrutural for proposta, ela deve preservar:

- edicao de \`tasks.md\` com o app aberto
- sync com GitHub
- backlog e board no mesmo modelo
- branch \`${tasksBranch}\`
- atribuicao por colaboradores do GitHub
`,
        'playbook/data-model.md': `# Modelo de Dados

## Fonte de verdade

O estado funcional das tarefas e o conteudo de \`tasks.md\`.

Durante o uso do app:

- o app trabalha primeiro no estado local
- persiste localmente
- sincroniza com a branch \`${tasksBranch}\` quando necessario

## Formato esperado de task

Cada task pode incluir:

- \`id\`
- \`title\`
- \`status\`
- \`description\`
- \`priority\`
- \`labels\`
- \`cardType\`
- \`assignee\`
- \`subtasks\`

Status suportados:

- \`backlog\`
- \`pending\`
- \`in_progress\`
- \`done\`

## Exemplo

\`\`\`md
- [ ] Melhorar sync remoto <!--meta:{"status":"backlog","description":"Criar fluxo seguro de pull e merge para tasks.","priority":"high","labels":["sync","github"],"cardType":"feature","assignee":"${owner}"}-->
  - [ ] Adicionar botao de puxar remoto
  - [ ] Exibir conflito quando houver dirty local
  - [ ] Permitir mesclar antes do sync
\`\`\`

## Regras de atualizacao

Quando um agente alterar \`tasks.md\`, ele deve:

1. preservar o que ja existe quando possivel
2. atualizar apenas o necessario
3. manter descricoes curtas e acionaveis
4. evitar tarefas gigantes sem subtarefas
5. adicionar trabalho novo no backlog quando fizer sentido
6. marcar progresso de forma incremental

## Parser

O parser:

- le markdown
- extrai metadata inline
- converte para JSON interno
- permite round-trip de volta para markdown

Qualquer alteracao na estrutura do arquivo precisa respeitar esse round-trip.
`,
        'playbook/sync.md': `# Sync

## Branch dedicada

Nome da branch:

- \`${tasksBranch}\`

Finalidade:

- armazenar apenas os arquivos de planejamento
- evitar poluir a \`main\` com commits constantes de tarefas
- separar codigo do produto e camada de planejamento

## Arquivos sincronizados na branch \`${tasksBranch}\`

- ${managedFilesList}

## Fluxos suportados

- \`tasks:cache\`: salva localmente
- \`tasks:save\`: envia para GitHub
- \`tasks:pull\`: busca remoto
- \`tasks:external-update\`: remoto mudou e pode ser aplicado
- \`tasks:remote-conflict\`: remoto mudou mas ha alteracoes locais
- \`tasks:local-file-update\`: arquivo local mudou por fora
- \`tasks:local-file-conflict\`: arquivo local mudou por fora mas ha alteracoes locais

## Regras de conflito

Quando existir concorrencia entre local e remoto:

- nao sobrescrever silenciosamente
- oferecer manter local
- oferecer carregar remoto
- oferecer mesclar

## Regras de merge

O merge atual deve:

- preservar o que foi editado localmente
- adicionar tasks remotas novas
- adicionar subtarefas remotas ausentes
- manter labels relevantes de ambos os lados

Se esse merge evoluir, a prioridade continua sendo previsibilidade, nao automacao opaca.
`,
        'playbook/ui.md': `# UI

## Selecao de repositorio

A tela deve:

- listar repositorios do GitHub
- permitir vincular clone local
- validar se a pasta corresponde ao repo escolhido
- carregar o repo com branch \`${tasksBranch}\`

## Header

O header do board deve indicar:

- repo ativo
- modo local
- branch de tasks
- arquivos gerenciados na branch \`${tasksBranch}\`

## Backlog

O backlog deve:

- mostrar somente tasks com \`status: "backlog"\`
- permitir filtros
- permitir enviar task para o board

## Board

O board deve:

- mostrar tasks com status de execucao
- suportar drag and drop
- permitir mover task de volta para backlog

## Conflitos

Ao detectar concorrencia, a UI deve oferecer:

- manter local
- carregar remoto
- mesclar
`,
        'playbook/playbooks.md': `# Playbooks

## Como um agente deve trabalhar neste projeto

### Antes de implementar

1. Ler \`tasks.md\`
2. Entender se a entrega ja existe no backlog ou board
3. Conferir o fluxo atual no app antes de redesenhar comportamento
4. Preservar o modelo local-first
5. Evitar propor "solucao magica" que sobrescreva estado do usuario

### Durante a implementacao

1. Alterar apenas o necessario
2. Preservar metadados existentes
3. Manter formato parseavel
4. Nao misturar codigo com a branch \`${tasksBranch}\`

### Depois da implementacao

1. Validar se a task ficou coerente
2. Manter backlog e board consistentes
3. Evitar lixo de teste ou placeholders sem sentido

## Anti-padroes

Um agente nao deve:

- apagar tasks existentes sem motivo claro
- reescrever todo \`tasks.md\` por conveniencia
- alterar o parser sem considerar round-trip
- criar automacoes que sobrescrevam estado local silenciosamente
- assumir que backlog e board sao estruturas separadas

## Futuro MCP

Se este projeto ganhar um MCP no futuro, ele deve expor pelo menos:

- repo ativo
- branch \`${tasksBranch}\`
- leitura de \`tasks.md\`
- escrita local em \`tasks.md\`
- \`tasks:pull\`
- \`tasks:save\`
- lista de colaboradores
- estado de dirty local
- conflitos remoto/local
`
    }
}

export async function ensureRepoAiContextFiles(localPath, repoInfo) {
    if (!localPath) {
        return { created: [] }
    }

    await mkdir(localPath, { recursive: true })

    const created = []
    const playbookFiles = createPlaybookFiles(repoInfo)

    await mkdir(getPlaybookDirPath(localPath), { recursive: true })

    for (const [fileName, content] of Object.entries(playbookFiles)) {
        const fullPath = getRepoContextFilePath(localPath, fileName)
        if (!(await fileExists(fullPath))) {
            await writeFile(fullPath, content, 'utf-8')
            created.push(fileName)
        }
    }

    // Clean up old single-file docs if they still exist in the local repo.
    for (const legacyPath of ['AGENTS.md', 'TASKS_WORKFLOW.md']) {
        const fullPath = getRepoContextFilePath(localPath, legacyPath)
        if (await fileExists(fullPath)) {
            await rm(fullPath, { force: true })
        }
    }

    return { created }
}

export async function readRepoAiContextFiles(localPath) {
    const result = {}

    for (const fileName of PLAYBOOK_FILES) {
        result[fileName] = await readRepoContextFile(localPath, fileName)
    }

    return result
}
