import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { execSync } from 'child_process';
import { AnalysisStrategy, FileListStrategy, DirectorySummaryStrategy, TypeSummaryStrategy } from './strategies/analysis.strategy';

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
    options: { isDefault: true }
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
        description: 'Tipo de commit (feat, fix, docs, etc)'
    })
    parseTipo(val: string): string {
        return val;
    }

    private strategies: AnalysisStrategy[] = [
        new FileListStrategy(),
        new DirectorySummaryStrategy(),
        new TypeSummaryStrategy()
    ];

    /**
     * Método run é executado quando o comando é chamado
     * @param inputs - Array de argumentos passados após o nome do comando
     * @param options - Objeto contendo as opções passadas com -- ou -
     * @returns Promise<void>
     */
    async run(inputs: string[], options: Record<string, any>): Promise<void> {
        try {
            const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
            const filesChanged = this.parseGitStatus(statusOutput);

            if (filesChanged.length === 0) {
                console.log(`${options.tipo || 'feat'}: sem arquivos alterados`);
                return;
            }

            let message = `${options.tipo || 'feat'}: alterações em ${filesChanged.length} arquivo(s)\n\n`;
            
            // Aplica cada estratégia de análise
            this.strategies.forEach(strategy => {
                message += strategy.analyze(filesChanged);
            });

            console.log(message);
        } catch (error) {
            console.error('Erro:', error.message);
            process.exit(1);
        }
    }

    private parseGitStatus(statusOutput: string): Array<{ status: string; file: string }> {
        return statusOutput
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => ({
                status: line.slice(0, 2).trim(),
                file: line.slice(3).trim()
            }));
    }
}

/**
 * @Module decorator define o módulo NestJS
 * - providers: lista de classes que podem ser injetadas como dependências
 *   - CommitGenCommand: nosso comando CLI que será registrado
 */
@Module({
    providers: [CommitGenCommand]
})
export class CliModule {} 