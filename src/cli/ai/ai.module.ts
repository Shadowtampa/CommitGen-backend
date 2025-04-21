import { Controller, Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface FileChange {
  status: string;
  content: string;
}

interface FileChanges {
  file: string;
  changes: FileChange[];
}

@Controller()
export class AiMessageGeneratorController {
  /**
   * Processa as mudanças dos arquivos e gera uma mensagem de commit
   * @param filesChanges - Array de objetos contendo as mudanças em cada arquivo
   * @returns Promise<string> - Mensagem de commit gerada
   *
   * Changelog: acho mais válido simplesmente passar o git diff.
   */
  async generateCommitMessage(
    diffOutput: string,
    tipo: string = 'feat',
  ): Promise<string> {
    const prompt = `

===============================

INSTRUCTIONS FOR THE COMMIT MESSAGE GENERATION:

- Given the git diff output, generate a commit message using the Conventional Commits v1.0.0 standard, based on the provided git diff. Follow these exact rules:

- Start with a type to describe the kind of change; Example: feat, fix, docs, style, refactor, test, chore; Example: feat: add login button

- Optionally include a scope in parentheses to clarify what part was changed; Example: fix(auth): correct password validation

- Use a colon and a short, lowercase summary right after the type/scope; Example: docs(readme): update installation steps

- Keep the summary concise and in the imperative mood (like giving a command); Example: feat(cart): add ability to remove items

- be EXTREMELY descriptive, and detail-oriented

================================

CONTEXT(Git Diff)


${diffOutput.replace(/['´]/g, '"')}

                      `;

    try {
      // Executar o comando ollama
      const result = execSync(`ollama run deepseek-r1:latest '${prompt}'`, {
        encoding: 'utf-8',
      });

      return result.trim();
    } catch (error) {

      throw error;
    }
  }
}
/**
 * @Module decorator define o módulo NestJS
 * - providers: lista de classes que podem ser injetadas como dependências
 *   - CommitGenCommand: nosso comando CLI que será registrado
 */
@Module({
  providers: [AiMessageGeneratorController],
  exports: [AiMessageGeneratorController],
})
export class AiMessageGenerator {}
