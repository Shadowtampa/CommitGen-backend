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
   */
  async generateCommitMessage(
    filesChanges: FileChanges[],
    tipo: string = 'feat',
  ): Promise<string> {
    let message = `${tipo}: `;

    // Analisa as mudanças para gerar uma mensagem descritiva
    filesChanges.forEach(({ file, changes }) => {
      const additions = changes.filter((c) => c.status === '+').length;
      const removals = changes.filter((c) => c.status === '-').length;

      message += `alterações em ${file} (${additions} adições, ${removals} remoções)`;
    });

    const prompt = `According to the changes below, generate a commit message following these instructions:
- Use the **Conventional Commits** pattern;

- Use this structure:   
"<description>

[optional body]

[optional footer(s)]"


 - Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.
 - The type feat MUST be used when a commit adds a new feature to your application or library.
 - The type fix MUST be used when a commit represents a bug fix for your application.
 - A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):
 - A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string.
 - A longer commit body MAY be provided after the short description, providing additional contextual information about the code changes. The body MUST begin one blank line after the description.
 - A commit body is free-form and MAY consist of any number of newline separated paragraphs.
 - One or more footers MAY be provided one blank line after the body. Each footer MUST consist of a word token, followed by either a :<space> or <space># separator, followed by a string value (this is inspired by the git trailer convention).
 - A footer's token MUST use - in place of whitespace characters, e.g., Acked-by (this helps differentiate the footer section from a multi-paragraph body). An exception is made for BREAKING CHANGE, which MAY also be used as a token.
 - A footer's value MAY contain spaces and newlines, and parsing MUST terminate when the next valid footer token/separator pair is observed.
 - Breaking changes MUST be indicated in the type/scope prefix of a commit, or as an entry in the footer.
 - If included as a footer, a breaking change MUST consist of the uppercase text BREAKING CHANGE, followed by a colon, space, and description, e.g., BREAKING CHANGE: environment variables now take precedence over config files.
 - If included in the type/scope prefix, breaking changes MUST be indicated by a ! immediately before the :. If ! is used, BREAKING CHANGE: MAY be omitted from the footer section, and the commit description SHALL be used to describe the breaking change.
 - Types other than feat and fix MAY be used in your commit messages, e.g., docs: update ref docs.
 - The units of information that make up Conventional Commits MUST NOT be treated as case sensitive by implementors, with the exception of BREAKING CHANGE which MUST be uppercase.
 - BREAKING-CHANGE MUST be synonymous with BREAKING CHANGE, when used as a token in a footer."

- ONLY generate the message. Do NOT explain it to me;

---
                    Arquivos alterados:
                    ${filesChanges
                      .map(
                        ({ file, changes }) => `
                    ${file}:
                    ${changes.map((c) => `  ${c.status} ${c.content}`).join('\n')}
                    `,
                      )
                      .join('\n')}
                      
                      ---
                      - generate the message in English-UK
                      - generate a list of the changes. 
                      - NEVER generate a single line message.

                      `;

    // Criar arquivo temporário
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'prompt.txt');
    fs.writeFileSync(tempFilePath, prompt);

    try {
      // Executar o comando ollama
      const result = execSync(`ollama run gemma:latest < ${tempFilePath}`, {
        encoding: 'utf-8',
      });

      // Limpar o arquivo temporário
      fs.unlinkSync(tempFilePath);

      return result.trim();
    } catch (error) {
      // Garantir que o arquivo temporário seja removido mesmo em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
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
