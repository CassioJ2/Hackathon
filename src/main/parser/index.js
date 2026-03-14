/**
 * Parser de Markdown ↔ JSON
 *
 * Formato suportado:
 * - [ ] Task pendente
 * - [x] Task concluída
 * - [/] Task em andamento
 *   - [ ] Subtask
 *   - [x] Subtask concluída
 */

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

/**
 * Converte markdown em array de tasks estruturadas.
 * @param {string} markdown
 * @returns {Array<Task>}
 */
export function parse(markdown) {
    taskCounter = 0
    const lines = markdown.split('\n')
    const tasks = []
    let currentTask = null

    for (const line of lines) {
        // Task principal (sem indentação)
        const taskMatch = line.match(/^- \[([x /])\] (.+)$/)
        if (taskMatch) {
            currentTask = {
                id: generateId(),
                title: taskMatch[2].trim(),
                status: statusFromCheckbox(taskMatch[1]),
                subtasks: []
            }
            tasks.push(currentTask)
            continue
        }

        // Subtask (com indentação de 2+ espaços)
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

/**
 * Converte array de tasks de volta para markdown.
 * @param {Array<Task>} tasks
 * @returns {string}
 */
export function stringify(tasks) {
    const lines = ['# Tasks', '']

    for (const task of tasks) {
        lines.push(`- [${checkboxFromStatus(task.status)}] ${task.title}`)
        for (const sub of task.subtasks || []) {
            lines.push(`  - [${checkboxFromStatus(sub.status)}] ${sub.title}`)
        }
    }

    return lines.join('\n') + '\n'
}
