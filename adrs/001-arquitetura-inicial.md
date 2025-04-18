# ADR 001 - Arquitetura inicial do CommitGen

## Status
Ativo

## Contexto
Precisamos de uma ferramenta offline que, a partir do output de um `git diff`, gere uma mensagem de commit padronizada, utilizando IA local (DeepSeek). A ferramenta deve ser simples, rápida e acessível via terminal.

## Decisão
A arquitetura inicial será baseada em um CLI construído com Node.js (NestJS) que:

- Lê `stdin` do terminal
- Processa e pré-trata o `diff`
- Passa para o motor de IA local (DeepSeek) com um prompt bem definido
- Retorna uma mensagem formatada segundo o padrão Conventional Commits
- Envia o output para o clipboard do usuário

## Alternativas consideradas
- Usar Python (descartado por não estar alinhado com a stack do autor)
- Usar chamadas à API externa (descartado por depender de internet)
- Desenvolver interface gráfica (foge do escopo do MVP)

## Consequências
- O uso de NestJS em CLI demanda adaptação (mas traz padronização de DI, testes e organização)
- A integração com IA local exige estrutura flexível de prompts
- Permite evolução futura para API, integração com IDEs, pre-commit hooks

