import { Controller, Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { execSync } from 'child_process';

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
    async generateCommitMessage(filesChanges: FileChanges[]): Promise<string> {
     
        let message = 'feat: ';
        
        // Analisa as mudanças para gerar uma mensagem descritiva
        filesChanges.forEach(({ file, changes }) => {
            const additions = changes.filter(c => c.status === '+').length;
            const removals = changes.filter(c => c.status === '-').length;
            
            message += `alterações em ${file} (${additions} adições, ${removals} remoções)`;
        });
        
        return message;
    }
}
/**
 * @Module decorator define o módulo NestJS
 * - providers: lista de classes que podem ser injetadas como dependências
 *   - CommitGenCommand: nosso comando CLI que será registrado
 */
@Module({
  providers: [AiMessageGeneratorController],
  exports: [AiMessageGeneratorController]
})
export class AiMessageGenerator {}

