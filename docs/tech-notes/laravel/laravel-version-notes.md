# Laravel — Version Notes (Fonte de Verdade)

Este documento define padrões e alertas para Laravel, incluindo convivência com legado e migrações.

---

## Regra de ouro

- Confirmar versão do Laravel e do PHP.
- Em migração: planejar por etapas + testes mínimos.
- Quando houver risco de breaking changes: consultar release notes oficiais.

### Documentação

- Consultar release notes do Laravel sempre que possível.
- Documentar migrações e breaking changes.

Fontes oficiais:

- [Laravel Release Notes](https://laravel.com/docs/releases)
- [Laravel GitHub Releases](https://github.com/laravel/framework/releases)
- [Laravel Documentation](https://laravel.com/docs/master)

---

## Arquitetura (padrão)

- Controllers magros.
- Validação em Form Requests.
- Regras de negócio fora do controller:
  - `Actions/` para casos de uso
  - `Services/` para integrações e domínio
  - `DTO/` para transporte de dados quando útil

Evitar:

- lógica complexa em Model
- “god services” gigantes

---

## Banco e Eloquent (regras práticas)

- Evitar N+1 sempre (eager loading consciente).
- Queries grandes: extrair para Query Objects/Repositories só quando necessário.
- Sempre tratar paginação para listas.
- Em jobs/queues: evitar carregar relações desnecessárias.

---

## Segurança (mínimo obrigatório)

- Policies/Gates para autorização.
- Validação sempre (requests).
- Mass assignment: fillable/guarded bem definidos.
- Não expor stack trace/erros em produção.

---

## Migrações e legado (playbook rápido)

Quando projeto é antigo:

1. Mapear versão atual (Laravel/PHP) e dependências.
2. Rodar suite mínima de testes (ou criar testes de fumaça).
3. Subir versões passo a passo (não “pular” sem estratégia).
4. Após cada salto:
   - rodar testes
   - revisar logs
   - validar rotas e auth

---

## Qualidade (tooling recomendado)

- Formatter: Pint (se aplicável)
- Static analysis: PHPStan (nível apropriado)
- Test: PHPUnit ou Pest

Documentar no projeto:

- como rodar checks
- como rodar testes
