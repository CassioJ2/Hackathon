# Playbooks

## Como um agente deve trabalhar neste projeto

### Antes de implementar

1. Ler `tasks.md`
2. Entender se a entrega ja existe no backlog ou board
3. Conferir o fluxo atual no app antes de redesenhar comportamento
4. Preservar o modelo local-first
5. Evitar propor "solucao magica" que sobrescreva estado do usuario

### Durante a implementacao

1. Alterar apenas o necessario
2. Preservar metadados existentes
3. Manter formato parseavel
4. Nao misturar codigo com a branch `tasks`

### Depois da implementacao

1. Validar se a task ficou coerente
2. Manter backlog e board consistentes
3. Evitar lixo de teste ou placeholders sem sentido

## Anti-padroes

Um agente nao deve:

- apagar tasks existentes sem motivo claro
- reescrever todo `tasks.md` por conveniencia
- alterar o parser sem considerar round-trip
- criar automacoes que sobrescrevam estado local silenciosamente
- assumir que backlog e board sao estruturas separadas

## Futuro MCP

Se este projeto ganhar um MCP no futuro, ele deve expor pelo menos:

- repo ativo
- branch `tasks`
- leitura de `tasks.md`
- escrita local em `tasks.md`
- `tasks:pull`
- `tasks:save`
- lista de colaboradores
- estado de dirty local
- conflitos remoto/local
