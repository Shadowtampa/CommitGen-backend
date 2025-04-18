import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { execSync } from 'child_process';
import {
  AnalysisStrategy,
  FileListStrategy,
  DirectorySummaryStrategy,
  TypeSummaryStrategy,
  CommitMessageStrategy
} from './strategies/analysis.strategy';

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
   * Define uma opção para o comando
   * @Option decorator configura como a opção será recebida
   * - flags: define os nomes da opção (--tipo ou -t)
   * - description: descrição da opção
   */
  @Option({
    flags: '-t, --tipo [string]',
    description: 'Tipo de commit (feat, fix, docs, etc)',
  })
  parseTipo(val: string): string {
    return val;
  }

  /**
   * Array de estratégias de análise que serão aplicadas na geração da mensagem
   * Cada estratégia implementa a interface AnalysisStrategy e fornece uma forma diferente
   * de analisar e formatar as mudanças nos arquivos
   */
  private strategies: AnalysisStrategy[] = [
    new FileListStrategy(),
    new DirectorySummaryStrategy(),
    new TypeSummaryStrategy(),
    new CommitMessageStrategy(),
  ];

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

      // Se não houver arquivos alterados, retorna mensagem apropriada
      if (filesChanged.length === 0) {
        console.log(`${options.tipo || 'feat'}: sem arquivos alterados`);
        return;
      }

      let message = '#####  ####### #     # #     # ### #######     #####  ####### #     #' 
      message += '\n#     # #     # ##   ## ##   ##  #     #       #     # #       ##    # ';
      message += '\n#       #     # # # # # # # # #  #     #       #       #       # #   # ';
      message += '\n#       #     # #  #  # #  #  #  #     #       #  #### #####   #  #  # ';
      message += '\n#       #     # #     # #     #  #     #       #     # #       #   # # ';
      message += '\n#     # #     # #     # #     #  #     #       #     # #       #    ## ';
      message += '\n #####  ####### #     # #     # ###    #        #####  ####### #     # \n\n\n';

      // Aplica cada estratégia de análise para gerar diferentes seções da mensagem
      this.strategies.forEach((strategy) => {
        message += strategy.analyze(filesChanged, options);
      });

      console.log(message);
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
}

/**
 * @Module decorator define o módulo NestJS
 * - providers: lista de classes que podem ser injetadas como dependências
 *   - CommitGenCommand: nosso comando CLI que será registrado
 */
@Module({
  providers: [CommitGenCommand],
})
export class CliModule {}
