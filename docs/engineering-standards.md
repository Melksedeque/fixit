# Engineering Standards

Este documento define os **padrões gerais de engenharia de software** adotados nos projetos, com foco em **consistência, qualidade, performance, segurança e manutenibilidade**.

Ele deve ser considerado a **fonte de verdade** sempre que houver dúvida técnica ou de organização.

---

## 🎯 Objetivos

- Padronizar decisões técnicas
- Facilitar manutenção e evolução
- Reduzir retrabalho e bugs
- Garantir legibilidade e previsibilidade
- Criar uma assinatura técnica consistente

---

## 🧠 Princípios Gerais

- **Simplicidade antes de abstração**
- Clareza > código “inteligente”
- Código é lido mais vezes do que escrito
- Mudanças devem ser pequenas e reversíveis
- Performance importa, mas **manutenibilidade vem primeiro**
- Segurança nunca é opcional

---

## 📁 Organização de Projetos (Padrão Geral)

Sempre que possível:

- docs/ # documentação do projeto
- src/ # código da aplicação
- tests/ # testes
- scripts/ # scripts auxiliares
- configs/ # configurações (quando fizer sentido)


### Regras
- `src/` contém apenas código de aplicação
- evitar lógica de negócio espalhada
- nomes de pastas e arquivos devem ser **autoexplicativos**
- evitar estruturas profundas demais

---

## 🔍 Qualidade de Código

Todo código deve:
- ter responsabilidade clara
- ser fácil de testar
- evitar efeitos colaterais implícitos
- falhar de forma previsível
- não depender de “conhecimento oculto”

Evite:
- funções muito longas
- classes que fazem “de tudo”
- lógica duplicada
- comentários explicando código ruim  
  → **prefira refatorar**

---

## 🔐 Segurança (Obrigatório)

- Nunca versionar credenciais, tokens ou `.env`
- Validar **toda entrada externa**
- Nunca confiar em dados do client
- Princípio do menor privilégio
- Logs não devem expor dados sensíveis

---

## ⚡ Performance (Com bom senso)

- Meça antes de otimizar
- Evite otimizações prematuras
- Prefira soluções simples e previsíveis
- Cache quando fizer sentido
- Evite queries ou renderizações desnecessárias

---

## 🧪 Testes

- Testes devem validar **comportamento**, não implementação
- Prioridade:
  1. testes unitários
  2. testes de integração
  3. E2E quando necessário
- Código sem teste deve ser exceção consciente

---

# 🧩 Padrões por Stack

---

## ⚛️ React / Next.js

### Organização sugerida

- src/
- app/ # bootstrap, providers, rotas (Next)
- components/ # componentes reutilizáveis
- features/ # código por domínio (auth, cart, etc)
- hooks/
- services/
- lib/
- types/


### Boas práticas
- Componentes pequenos e previsíveis
- Preferir composição a herança
- Hooks bem definidos e reutilizáveis
- Evitar re-renderizações desnecessárias
- Separar lógica de UI

---

## 🐘 Laravel

### Organização sugerida

- app/
- Http/
- Controllers/
- Requests/
- Services/
- Actions/
- DTO/
- tests/


### Boas práticas
- Controllers magros
- Regras de negócio fora do controller
- Validação via Form Requests
- Evitar lógica complexa em models
- Atenção a N+1 e eager loading

---

## 🌐 WordPress (Plugins)

### Organização sugerida

- plugin-name/
- includes/
- admin/
- public/
- assets/
- languages/


### Boas práticas
- Código sempre extensível via hooks
- Segurança: nonces, capabilities, sanitização
- Evitar lógica pesada em hooks globais
- Compatibilidade sempre considerada
- Seguir WordPress Coding Standards

---

## 📌 Nota Final

Esses padrões são **vivos**.  
Sempre que uma exceção for necessária, ela deve ser **consciente, documentada e justificada**.
