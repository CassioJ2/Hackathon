# CodeSprint — Pesquisa de Precificação

> **Documento interno de decisão de produto e negócio.**
> Uso: discussão estratégica de pricing para MVP, hackathon e início de startup.
> Inferências estratégicas estão sinalizadas ao longo do texto.

---

## 1. Resumo executivo

O CodeSprint opera numa categoria ainda mal definida pelo mercado: não é simplesmente um gerenciador de tarefas, nem um AI copilot de código, e sim uma **camada de reconciliação entre planejamento e implementação**. Esse posicionamento tem implicações diretas na precificação.

**Lógica ideal de precificação:** cobrar pelo valor de reduzir o drift entre o que foi planejado e o que foi feito — não pelo volume de tarefas criadas ou pelas integrações disponíveis. O produto precisa ser percebido como infraestrutura do processo de desenvolvimento, não como uma ferramenta de organização.

**Por que cobrar como "mais um PM tool" seria ruim:** se o CodeSprint for percebido como equivalente ao Linear ou ao Notion, o teto de preço cai imediatamente para a faixa de US$ 8–20/usuário/mês, e a comparação direta com players consolidados elimina qualquer vantagem competitiva. O risco de virar "mais caro e menor" é real.

**Por que o valor pode subir com o posicionamento correto:** se o produto for percebido como AI-native workflow intelligence — algo que detecta ativamente quando o código divergiu do planejamento e age sobre isso — a disposição a pagar aumenta, especialmente em equipes técnicas que sentem essa dor diariamente. Essa percepção de valor é o ativo mais importante a proteger nos primeiros meses. *(Inferência estratégica: baseada em padrões de percepção de valor em ferramentas de developer workflow, não em pesquisa primária com usuários do CodeSprint.)*

---

## 2. Tese de precificação

### Modelos avaliados

| Modelo | Racional | Viabilidade para CodeSprint |
|---|---|---|
| Por assento | Simples, previsível, familiar ao comprador | ✅ adequado para early SaaS |
| Por equipe | Previsível, incentiva adoção em grupo | ✅ interessante como fallback |
| Por projeto | Alinha custo ao uso real, mas cria fricção | ⚠️ complexo de explicar |
| Por uso de IA | Justo, mas imprevisível para o cliente | ⚠️ aceitável como add-on |
| Modelo híbrido | Captura mais valor, mas aumenta complexidade | ✅ recomendado a partir da Fase 2 |

### Modelo recomendado

**Fase inicial:** cobrança **por assento**, com limite de projetos por plano e cota mensal de operações de IA (reconciliações, sugestões, análises de drift).

**Justificativa:** o modelo por assento é o mais fácil de vender em B2B early-stage. O limite de projetos e a cota de IA são os principais alavancadores de upsell natural sem criar fricção de preço variável imprevisível para o cliente.

O modelo híbrido — assento + cota de IA — deve ser adotado gradualmente quando o produto tiver dados suficientes de consumo médio para precificar com segurança.

---

## 3. Benchmark de mercado

O CodeSprint não tem um concorrente direto exato, mas fica na interseção de categorias adjacentes. A comparação é útil para ancorar a percepção de preço.

| Categoria | Exemplos | Preço médio | Comparação com CodeSprint |
|---|---|---|---|
| Project management | Jira, Linear, Asana | US$ 8–20/usuário/mês | CodeSprint cobre parte desse escopo, mas não substitui completamente |
| Backlog / issue tracking | GitHub Issues, YouTrack | Gratuito–US$ 10/mês | CodeSprint vai além ao versionar e reconciliar o backlog com o código |
| AI coding assistants | GitHub Copilot, Cursor | US$ 10–19/usuário/mês | CodeSprint não compete no autocomplete, mas compete na camada de contexto |
| AI copilots para times | Copilot Workspace, Devin | US$ 20–500+/mês | Mais próximos da proposta de valor, porém focados em geração de código |
| Git-native dev workflow | Raycast, Gitpod, Graphite | US$ 0–25/usuário/mês | Fluxo mais próximo, mas sem camada de reconciliação de backlog |

**Posicionamento natural do CodeSprint:** entre gestão de produto orientada a dev e fluxo de desenvolvimento assistido por IA. Não é um Jira, não é um Copilot. Isso é tanto a força quanto o risco — requer mais educação do comprador no início.

---

## 4. Faixa de preço recomendada

> *As faixas abaixo são inferências estratégicas baseadas em benchmarks de mercado e percepção de valor comparada. Não são resultado de pesquisa com usuários pagantes do CodeSprint.*

| Faixa | Valor por usuário/mês | Avaliação |
|---|---|---|
| Entrada | US$ 12–18 | Defensável como early-adopter pricing |
| Ideal | US$ 20–30 | Alinha com percepção de valor AI-native |
| Premium / Business | US$ 40–60 | Possível para times com uso intenso de IA e compliance |
| Barato demais | < US$ 10 | Sinaliza "feature", não produto; dificulta monetização sustentável |
| Caro demais (estágio atual) | > US$ 80 | Exige prova de ROI robusta que o MVP ainda não tem |

**Recomendação objetiva:** US$ 20–25/usuário/mês como preço âncora do plano principal pago. O plano Team deve ser o centro de gravidade comercial nos primeiros 12 meses.

---

## 5. Modelo recomendado por fase

### Fase 1 — Piloto / Design Partners

- **Forma de cobrança:** acesso gratuito ou simbólico (US$ 0–99/mês por equipe)
- **Preço sugerido:** gratuito ou flat fee de US$ 49–99/mês por equipe de até 5 pessoas
- **Justificativa:** o objetivo desta fase não é receita, é validação de retenção, NPS e casos de sucesso documentados. Preço zero facilita entrada. Preço simbólico filtra compradores sérios e treina o time a vender desde cedo.

### Fase 2 — Early SaaS

- **Forma de cobrança:** por assento, com planos fixos (Solo, Team, Business)
- **Preço sugerido:** Solo US$ 15/mês, Team US$ 20–25/usuário/mês, Business US$ 35–45/usuário/mês
- **Justificativa:** self-serve com trial de 14 dias. Foco em conversão de design partners para pagantes e aquisição orgânica via comunidades dev.

### Fase 3 — Expansão / Business / Enterprise

- **Forma de cobrança:** híbrido (assento + cota de IA + módulos enterprise como SSO, audit log, integrações customizadas)
- **Preço sugerido:** Business US$ 40–60/usuário/mês; Enterprise negociado (US$ 5k–20k+/ano por time)
- **Justificativa:** nesta fase o produto deve ter dados de ROI comprovados (tempo economizado em revisões de backlog, bugs de escopo evitados, etc.) que justifiquem o preço frente a decisores financeiros em empresas maiores.

---

## 6. Estrutura de planos sugerida

### Free

- **Preço:** US$ 0
- **Público:** devs individuais explorando o produto, estudantes, projetos pessoais
- **Features principais:** 1 projeto, integração GitHub básica, histórico de 30 dias, reconciliações limitadas (ex: 20/mês)
- **Limites:** sem IA contextual avançada, sem colaboração em equipe, sem exportação
- **Lógica estratégica:** geração de awareness e top-of-funnel. Não deve ser competitivo o suficiente para substituir o plano pago em uso real de equipe.

### Solo

- **Preço:** US$ 15/mês
- **Público:** freelancers técnicos, dev indie, consultores solo
- **Features principais:** até 3 projetos, integração GitHub/GitLab, histórico de 90 dias, 100 reconciliações/mês com IA
- **Limites:** sem colaboração em equipe, sem permissões granulares
- **Lógica estratégica:** captura devs que pagam do próprio bolso. Ticket baixo, mas alto volume potencial.

### Team *(plano âncora)*

- **Preço:** US$ 20–25/usuário/mês
- **Público:** squads pequenas (3–10 pessoas), startups em prototipagem, times de produto early-stage
- **Features principais:** projetos ilimitados, integração GitHub/GitLab avançada, histórico completo, 500 reconciliações/mês com IA, analytics básico de drift, colaboração e comentários, exportação de contexto
- **Limites:** sem SSO, sem audit log, sem integrações enterprise
- **Lógica estratégica:** este é o plano que deve ser empurrado comercialmente. É onde a proposta de valor central do CodeSprint se manifesta com força.

### Business

- **Preço:** US$ 40–45/usuário/mês
- **Público:** times de produto maiores, empresas com múltiplas squads, ambientes com compliance básico
- **Features principais:** tudo do Team + reconciliações ilimitadas, analytics avançado, permissões por papel, histórico de auditoria, suporte prioritário
- **Limites:** sem SLA contratual, sem deployment privado
- **Lógica estratégica:** upsell natural do Team quando o time cresce e o uso de IA intensifica.

### Enterprise

- **Preço:** negociado (estimativa: US$ 5.000–20.000+/ano por time/departamento)
- **Público:** empresas médias e grandes com times de engenharia estruturados
- **Features principais:** tudo do Business + SSO/SAML, deployment on-premise ou VPC, SLA contratual, onboarding dedicado, integrações customizadas
- **Lógica estratégica:** não deve ser o foco antes da Fase 3. Venda enterprise no estágio atual consumiria capacidade operacional desproporcional ao retorno.

---

## 7. O que deve ou não estar atrás de paywall

### Deve estar no plano base (Free)

- Criação e edição de backlog textual
- 1 projeto ativo
- Integração GitHub básica (leitura de commits e PRs)
- Histórico de 30 dias
- Visualização do board básico

### Deve estar em planos pagos (Solo/Team)

- Múltiplos projetos
- Integração GitHub/GitLab avançada (webhooks, automações)
- Reconciliação automática backlog ↔ código
- Histórico estendido (90 dias a ilimitado)
- Colaboração em equipe e comentários
- Exportação de contexto (markdown, JSON)

### Deve estar em planos premium (Business/Enterprise)

- Analytics de drift e relatórios de divergência
- Permissões granulares por papel
- Histórico de auditoria
- SSO/SAML
- Suporte prioritário e SLA

### Deve ser add-on ou crédito de IA

- Reconciliações e sugestões de IA acima da cota do plano
- Geração automática de histórias a partir de commits
- Análise de impacto de mudança de escopo com IA
- Exportação de contexto para modelos externos (ex: Claude, GPT via API)

**Obs:** o custo variável de IA é o principal risco financeiro do produto. A cota mensal de reconciliações deve ser calibrada com margem de segurança após os primeiros dados de uso real dos design partners.

---

## 8. Riscos de pricing

### Risco 1 — Ser percebido como "feature, não produto"
Este é o maior risco atual. Se o comprador enxergar a reconciliação backlog-código como algo que o GitHub Projects ou o Linear "poderia fazer", o teto de preço cai para zero. **Mitigação:** os casos de uso precisam demonstrar valor antes do preço aparecer.

### Risco 2 — Parecer barato demais
Preço abaixo de US$ 10/usuário em um produto AI-native sinaliza falta de confiança no próprio valor. Pode prejudicar a percepção em avaliações enterprise. **Mitigação:** evitar entrar no mercado com preço agressivo apenas para adoção; preferir acesso gratuito via trial ao invés de preço baixo como estratégia.

### Risco 3 — Comparação direta com Jira/Linear/Notion
Se o pitch for "backlog + board + IA", o comprador vai comparar com o que já usa. Perder esse comparativo é quase certo. **Mitigação:** o pitch deve focar em "você sabe quando seu backlog mentiu para você?" — problema, não feature list.

### Risco 4 — Custo variável de IA crescendo desproporcionalmente
À medida que o uso escala, o custo por chamada de IA pode corroer a margem. Planos com cota ilimitada tendem a ser perigosos enquanto o custo de tokens não for previsível. **Mitigação:** estabelecer cotas claras nos planos e monitorar custo médio por usuário ativo desde o início.

### Risco 5 — Dificuldade de provar ROI no início
Sem dados de tempo economizado, bugs de escopo evitados ou melhora de previsibilidade de sprint, o produto vive de promessa. Compradores B2B, especialmente em empresas maiores, precisam de ROI tangível. **Mitigação:** coletar métricas de uso desde os design partners e construir narrativa de ROI com dados reais.

---

## 9. Buyer que pagaria primeiro

| Perfil | Dor sentida | Fricção de compra | Probabilidade |
|---|---|---|---|
| Founder técnico (CTO/cofundador dev) | Alta — vive o drift entre planejamento e código | Baixa — decide sozinho, orçamento próprio | ⭐⭐⭐⭐⭐ |
| Tech lead de squad pequena | Alta — é responsável por alinhamento técnico e de produto | Média — precisa de aprovação de budget | ⭐⭐⭐⭐ |
| Squad AI-native (3–5 pessoas) | Alta — usa IA no dia a dia e entende o valor de contexto | Baixa — uso coletivo dilui o custo por pessoa | ⭐⭐⭐⭐ |
| Freelancer técnico | Média — sente o problema, mas tem ticket médio menor | Baixa — decide sozinho | ⭐⭐⭐ |
| Startup em prototipagem rápida | Alta — muda de direção constantemente e perde rastreabilidade | Baixa — cultura de adoção rápida de ferramentas | ⭐⭐⭐⭐ |
| Time de produto pequeno | Média — sente o problema mas pode não ser o decisor técnico | Alta — envolve PM e dev, decisão mais lenta | ⭐⭐ |

**Buyer prioritário:** founder técnico ou tech lead de startup early-stage com 3–8 devs. Esse perfil sente a dor, tem autonomia para comprar e não precisa de processo de procurement.

---

## 10. Estratégia de entrada no mercado

### É melhor começar barato para adoção?
**Não como regra.** Começar barato pode ajudar na adoção inicial, mas se o preço for tão baixo que não exige comprometimento do comprador, os dados de uso coletados serão de baixa qualidade. Prefira **acesso gratuito por trial** (14–30 dias) ao invés de preço permanentemente baixo.

### É melhor começar premium para posicionamento?
**Parcialmente.** Um posicionamento premium desde o início protege a percepção de valor, mas exige que o produto já entregue o prometido com consistência. No estágio atual, o produto ainda precisa provar retenção antes de defender um preço premium.

### É melhor vender piloto manual antes de pricing público?
**Sim — esta é a recomendação para os próximos 3–4 meses.** Piloto manual com 3–8 design partners permite calibrar pricing, coletar casos de uso reais e construir narrativa de ROI. Nenhuma decisão de preço público deveria ser tomada sem esses dados.

### Quando abrir self-serve?
Após ter pelo menos 2–3 casos de sucesso documentados com design partners e um produto estável o suficiente para onboarding sem suporte intensivo. Estimar esse ponto entre 3–6 meses após o lançamento do MVP.

---

## 11. Recomendação final

**Melhor modelo de pricing para o CodeSprint hoje:** por assento, com cota mensal de operações de IA e limite de projetos como alavanca de upsell.

**Faixa de preço mais defensável:** US$ 20–25/usuário/mês para o plano Team, com possibilidade de escalar para US$ 40–50 no plano Business conforme o produto amadurece.

**Plano principal a ser empurrado:** **Team** — é onde a proposta de valor central do CodeSprint se manifesta, onde a compra coletiva reduz fricção e onde o ticket médio é defensável.

**Recomendação prática:**

- **Para o hackathon:** não entre com planos pagos. Demonstre o produto com liberdade de uso e foque em comunicar o diferencial da reconciliação. O pricing é secundário neste contexto.
- **Para o MVP:** comece com trial gratuito de 14 dias e um plano Team simples em torno de US$ 20–25/usuário/mês. Não construa 5 planos antes de ter 10 clientes pagantes.
- **Para o início da startup:** feche os primeiros 5 clientes manualmente com preço negociado (flat fee por equipe é mais fácil de negociar do que por assento no início). Use esses contratos para calibrar o pricing público.

---

## 12. Tabela final resumida

| Plano | Preço | Público | Principal valor percebido | Observações |
|---|---|---|---|---|
| Free | US$ 0 | Devs individuais, exploração | Visibilidade do backlog versionado | Limite de 1 projeto e 20 reconciliações/mês |
| Solo | US$ 15/mês | Freelancers, devs indie | Rastreabilidade pessoal de projetos | Sem colaboração em equipe |
| **Team** | **US$ 20–25/usuário/mês** | **Squads 3–10 pessoas, startups** | **Reconciliação AI-native backlog ↔ código** | **Plano âncora — foco comercial principal** |
| Business | US$ 40–45/usuário/mês | Times maiores, compliance básico | Analytics de drift, permissões, auditoria | Upsell natural do Team |
| Enterprise | Negociado (US$ 5k–20k+/ano) | Empresas médias/grandes | SLA, SSO, deployment privado, integração customizada | Não priorizar antes da Fase 3 |

---

*Documento elaborado para uso interno de decisão de produto e negócio. Revisão recomendada após coleta de dados com design partners.*
