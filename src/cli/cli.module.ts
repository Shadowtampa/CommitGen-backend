import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { execSync } from 'child_process';
import {
  AnalysisStrategy,
  FileListStrategy,
  DirectorySummaryStrategy,
  TypeSummaryStrategy,
} from './strategies/analysis.strategy';
import {
  AiMessageGenerator,
  AiMessageGeneratorController,
} from './ai/ai.module';

/**
 * @Command decorator define as configurações do comando CLI
 * - name: nome do comando que será usado na linha de comando
 * - description: descrição do comando que aparece na ajuda
 * - options: configurações adicionais do comando
 *   - isDefault: true indica que este é o comando padrão executado quando nenhum outro é especificado
 */
@Command({
  name: 'gen',
  description: 'Gera uma mensagem de commit baseada nas mudanças do git',
  options: { isDefault: true },
})
export class CommitGenCommand extends CommandRunner {
  /**
   * Array de estratégias de análise que serão aplicadas na geração da mensagem
   * Cada estratégia implementa a interface AnalysisStrategy e fornece uma forma diferente
   * de analisar e formatar as mudanças nos arquivos
   */
  strategies: AnalysisStrategy[] = [
    new FileListStrategy(),
    new DirectorySummaryStrategy(),
    new TypeSummaryStrategy(),
  ];
  verbose: boolean = false;
  constructor(private readonly aiGenerator: AiMessageGeneratorController) {
    super();
  }

  /**
   * Define uma opção para o comando
   * @Option decorator configura como a opção será recebida
   * - flags: define os nomes da opção (--tipo ou -t)
   * - description: descrição da opção
   */
  @Option({
    flags: '-t, --tipo [string]',
    description: 'Tipo de commit (feat, fix, docs, etc)',
    defaultValue: 'feat',
  })
  parseTipo(val: string): string {
    return val;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'verbose mode',
    defaultValue: false,
    required: false,
  })
  parseVerbose(): void {
    console.log('Modo verbose ativado');
    this.verbose = true;
  }

  /**
   * Método run é executado quando o comando é chamado
   * @param inputs - Array de argumentos passados após o nome do comando
   * @param options - Objeto contendo as opções passadas com -- ou -
   * @returns Promise<void>
   */
  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    try {
      // Obtém o status dos arquivos do git no formato porcelain
      const statusOutput = execSync('git status --porcelain', {
        encoding: 'utf8',
      });
      const filesChanged = this.parseGitStatus(statusOutput);

      // Obtém o diff dos arquivos staged
      const diffOutput = execSync('git diff --staged', { encoding: 'utf8' });
      // const changedFilesContent = this.parseGitDiff(diffOutput);

      // Se não houver arquivos alterados, retorna mensagem apropriada
      if (filesChanged.length === 0) {
        console.log(`${options.tipo || 'feat'}: sem arquivos alterados`);
        return;
      }

      let cabecalho =
        ' #####  ####### #     # #     # ### #######     #####  ####### #     #';
      cabecalho +=
        '\n#     # #     # ##   ## ##   ##  #     #       #     # #       ##    # ';
      cabecalho +=
        '\n#       #     # # # # # # # # #  #     #       #       #       # #   # ';
      cabecalho +=
        '\n#       #     # #  #  # #  #  #  #     #       #  #### #####   #  #  # ';
      cabecalho +=
        '\n#       #     # #     # #     #  #     #       #     # #       #   # # ';
      cabecalho +=
        '\n#     # #     # #     # #     #  #     #       #     # #       #    ## ';
      cabecalho +=
        '\n #####  ####### #     # #     # ###    #        #####  ####### #     # \n\n\n';

      console.log(cabecalho);

      // Aplica cada estratégia de análise para gerar diferentes seções da mensagem
      this.strategies.forEach((strategy) => {
        if (this.verbose) {
          console.log(strategy.analyze(filesChanged, options));
        }
      });

      // Gera a mensagem de commit usando IA
      const commitMessage =
        await this.aiGenerator.generateCommitMessage(diffOutput, options.tipo);
      console.log(commitMessage);
    } catch (error) {
      console.error('Erro:', error.message);
      process.exit(1);
    }
  }

  /**
   * Converte a saída do comando git status --porcelain em um array de objetos
   * contendo o status e o caminho do arquivo
   * @param statusOutput - Saída do comando git status --porcelain
   * @returns Array de objetos com status e caminho do arquivo
   */
  private parseGitStatus(
    statusOutput: string,
  ): Array<{ status: string; file: string }> {
    return statusOutput
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3).trim(),
      }));
  }

  /**
   * Converte a saída do comando git diff --staged em um array de objetos
   * contendo o nome do arquivo e suas mudanças
   * @param diffOutput - Saída do comando git diff --staged
   * @returns Array de objetos com nome do arquivo e mudanças
   */
  private parseGitDiff(diffOutput: string): Array<{
    file: string;
    changes: Array<{ status: string; content: string }>;
  }> {
    const result: Array<{
      file: string;
      changes: Array<{ status: string; content: string }>;
    }> = [];

    // Divide o diff por arquivos
    const fileDiffs = diffOutput.split('diff --git');
    fileDiffs.shift(); // Remove o primeiro elemento vazio

    for (const fileDiff of fileDiffs) {
      // Extrai o nome do arquivo
      const fileMatch = fileDiff.match(/a\/(.*?)\s+b\/(.*?)(?:\n|$)/);
      if (!fileMatch) continue;

      const file = fileMatch[2]; // Usa o nome do arquivo após as mudanças
      const changes: Array<{ status: string; content: string }> = [];

      // Processa cada bloco de mudanças
      const changeBlocks = fileDiff.split('@@');
      changeBlocks.shift(); // Remove o primeiro elemento (cabeçalho)

      for (const block of changeBlocks) {
        // Processa cada linha do bloco
        const lines = block.split('\n');
        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            changes.push({
              status: '+',
              content: line.substring(1),
            });
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            changes.push({
              status: '-',
              content: line.substring(1),
            });
          }
        }
      }

      if (changes.length > 0) {
        result.push({
          file,
          changes,
        });
      }
    }

    return result;
  }
}

/**
 * @Module decorator define o módulo NestJS
 * - providers: lista de classes que podem ser injetadas como dependências
 *   - CommitGenCommand: nosso comando CLI que será registrado
 * - imports: lista de módulos importados
 *   - AiMessageGenerator: módulo que fornece o serviço de geração de mensagens
 */
@Module({
  imports: [AiMessageGenerator],
  providers: [CommitGenCommand],
})
export class CliModule {}
