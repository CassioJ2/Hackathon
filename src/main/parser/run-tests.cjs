const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

function loadParserModule() {
    const filePath = join(__dirname, 'index.js')
    const source = readFileSync(filePath, 'utf-8')
        .replace('export function parse', 'function parse')
        .replace('export function stringify', 'function stringify')

    const factory = new Function(`${source}\nreturn { parse, stringify }`)
    return factory()
}

function run(name, fn) {
    try {
        fn()
        console.log(`PASS ${name}`)
    } catch (error) {
        console.error(`FAIL ${name}`)
        throw error
    }
}

const { parse, stringify } = loadParserModule()

run('parse converte tasks e subtasks com status corretamente', () => {
    const markdown = [
        '# Tasks',
        '',
        '- [ ] Planejar backend',
        '  - [x] Definir schema',
        '  - [/] Integrar GitHub',
        '- [x] Validar parser'
    ].join('\n')

    const tasks = parse(markdown)

    assert.equal(tasks.length, 2)
    assert.equal(tasks[0].title, 'Planejar backend')
    assert.equal(tasks[0].status, 'pending')
    assert.equal(tasks[0].subtasks.length, 2)
    assert.equal(tasks[0].subtasks[0].status, 'done')
    assert.equal(tasks[0].subtasks[1].status, 'in_progress')
    assert.equal(tasks[1].status, 'done')
})

run('stringify preserva a estrutura esperada para round-trip', () => {
    const tasks = [
        {
            id: 'TASK-001',
            title: 'Implementar sync',
            status: 'in_progress',
            subtasks: [
                { id: 'TASK-001-001', title: 'Ler tasks.md', status: 'done' },
                { id: 'TASK-001-002', title: 'Salvar tasks.md', status: 'pending' }
            ]
        }
    ]

    const markdown = stringify(tasks)
    const reparsed = parse(markdown)

    assert.equal(markdown, '# Tasks\n\n- [/] Implementar sync\n  - [x] Ler tasks.md\n  - [ ] Salvar tasks.md\n')
    assert.equal(reparsed.length, 1)
    assert.equal(reparsed[0].title, 'Implementar sync')
    assert.equal(reparsed[0].subtasks.length, 2)
    assert.equal(reparsed[0].subtasks[0].title, 'Ler tasks.md')
    assert.equal(reparsed[0].subtasks[1].status, 'pending')
})
