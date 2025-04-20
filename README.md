# CommitGen

CommitGen é uma ferramenta CLI que utiliza IA para gerar mensagens de commit automaticamente, seguindo o padrão Conventional Commits.

## 🚀 Instalação

### Pré-requisitos

1. Node.js (versão 14 ou superior)
2. Ollama (para execução do modelo de IA)

### Configuração do Ollama

1. Instale o Ollama:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. Baixe o modelo Gemma:
```bash
ollama pull gemma:latest
```

3. Inicie o servidor Ollama:
```bash
ollama serve
```

## 📦 Instalação do CommitGen

Clone este repositório;
entre na raiz do projeto e rode: 

```bash
npm run build && chmod +x dist/main.js && npm install -g .
```

## 💻 Uso

Para gerar uma mensagem de commit automaticamente:

```bash
commit-gen
```

## 🔧 Configuração

O CommitGen suporta diferentes tipos de commit:
- `feat`: Para novas funcionalidades
- `fix`: Para correções de bugs
- `docs`: Para documentação
- `style`: Para formatação, ponto e vírgula, etc.
- `refactor`: Para refatoração de código
- `test`: Para adicionar testes
- `chore`: Para atualizações de tarefas, configurações, etc.

## 🛠️ Funcionalidades

- Geração automática de mensagens de commit
- Suporte ao padrão Conventional Commits
- Integração com modelos de IA via Ollama
- Suporte a múltiplos tipos de commit

## 📋 Roadmap

- [ ] Implementar parser de "esquema.js" para validação técnica
- [ ] Adicionar suporte a mais modelos de IA
- [ ] Implementar configuração personalizada de tipos de commit
- [ ] Adicionar suporte a hooks de pre-commit
- [ ] Melhorar a documentação e exemplos de uso
- [ ] Suporte à outras línguas

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de enviar um pull request.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
