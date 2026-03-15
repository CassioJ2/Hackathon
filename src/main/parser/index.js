/**
 * Parser de Markdown <-> JSON
 *
 * Formato suportado:
 * - [ ] Task pendente
 * - [x] Task concluida
 * - [/] Task em andamento
 *   - [ ] Subtask
 *   - [x] Subtask concluida
 *
 * Metadados extras (description, priority, labels, cardType, assignee) sao
 * armazenados como um comentario HTML inline no final da linha da task:
 * - [ ] Task title <!--meta:{"priority":"high","labels":["bug"]}-->
 */

const META_PREFIX = '<!--meta:'
const META_SUFFIX = '-->'

let taskCounter = 0

function generateId(prefix = 'TASK') {
    return `${prefix}-${String(++taskCounter).padStart(3, '0')}`
}

function statusFromCheckbox(checkbox) {
    if (checkbox === 'x') return 'done'
    if (checkbox === '/') return 'in_progress'
    return 'pending'
}

function checkboxFromStatus(status) {
    if (status === 'done') return 'x'
    if (status === 'in_progress') return '/'
    return ' '
}

function extractMeta(raw) {
    const idx = raw.indexOf(META_PREFIX)
    if (idx === -1) return { title: raw.trim(), meta: {} }

    const title = raw.slice(0, idx).trim()
    const end = raw.lastIndexOf(META_SUFFIX)
    const metaStr = raw.slice(idx + META_PREFIX.length, end)
    try {
        return { title, meta: JSON.parse(metaStr) }
    } catch {
        return { title, meta: {} }
    }
}

function buildMetaSuffix(task) {
    const meta = {}
    if (task.description) meta.description = task.description
    if (task.priority) meta.priority = task.priority
    if (task.labels?.length) meta.labels = task.labels
    if (task.status && !['pending', 'in_progress', 'done'].includes(task.status)) meta.status = task.status
    if (task.cardType && task.cardType !== 'task') meta.cardType = task.cardType
    if (task.assignee) meta.assignee = task.assignee
    if (Object.keys(meta).length === 0) return ''
    return ` ${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}`
}

export function parse(markdown) {
    taskCounter = 0
    const lines = markdown.split('\n')
    const tasks = []
    let currentTask = null

    for (const line of lines) {
        const taskMatch = line.match(/^- \[([x /])\] (.+)$/)
        if (taskMatch) {
            const { title, meta } = extractMeta(taskMatch[2])
            currentTask = {
                id: generateId(),
                title,
                status: meta.status || statusFromCheckbox(taskMatch[1]),
                description: meta.description || '',
                priority: meta.priority || '',
                labels: meta.labels || [],
                cardType: meta.cardType || 'task',
                assignee: meta.assignee || '',
                subtasks: []
            }
            tasks.push(currentTask)
            continue
        }

        const subtaskMatch = line.match(/^ {2,}- \[([x /])\] (.+)$/)
        if (subtaskMatch && currentTask) {
            currentTask.subtasks.push({
                id: generateId(currentTask.id),
                title: subtaskMatch[2].trim(),
                status: statusFromCheckbox(subtaskMatch[1])
            })
        }
    }

    return tasks
}

export function stringify(tasks) {
    const lines = ['# Tasks', '']

    for (const task of tasks) {
        const metaSuffix = buildMetaSuffix(task)
        lines.push(`- [${checkboxFromStatus(task.status)}] ${task.title}${metaSuffix}`)
        for (const sub of task.subtasks || []) {
            lines.push(`  - [${checkboxFromStatus(sub.status)}] ${sub.title}`)
        }
    }

    return lines.join('\n') + '\n'
}
