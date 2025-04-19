import * as path from 'path';
import clipboard from 'clipboardy';

/**
 * Interface que define o contrato para todas as estratégias de análise
 * Cada estratégia deve implementar o método analyze que recebe uma lista de arquivos
 * alterados e retorna uma string formatada com a análise
 */
export interface AnalysisStrategy {
    analyze(files: Array<{ status: string; file: string }>, options?: Record<string, any>): string;
}

/**
 * Estratégia que lista todos os arquivos alterados de forma numerada
 * Mostra o caminho relativo do arquivo e seu status (modificado, adicionado, etc)
 */
export class FileListStrategy implements AnalysisStrategy {
    /**
     * Analisa os arquivos e gera uma lista numerada com o caminho e status de cada um
     * @param files - Array de objetos contendo status e caminho dos arquivos
     * @returns String formatada com a lista de arquivos
     */
    analyze(files: Array<{ status: string; file: string }>): string {
        let message = 'Arquivos alterados:\n';
        files.forEach(({ status, file }, index) => {
            const statusDesc = this.getStatusDescription(status);
            const dir = path.dirname(file);
            const fileName = path.basename(file);
            const prefix = dir === '.' ? '' : `${dir}/`;
            message += `${index + 1}. ${prefix}${fileName} (${statusDesc})\n`;
        });
        return message;
    }

    /**
     * Converte o código de status do git para uma descrição em português
     * @param status - Código de status do git (M, A, D, R, ??)
     * @returns Descrição do status em português
     */
    private getStatusDescription(status: string): string {
        const descriptions = {
            'M': 'modificado',
            'A': 'adicionado',
            'D': 'deletado',
            'R': 'renomeado',
            '??': 'não rastreado'
        };
        return descriptions[status] || status;
    }
}

/**
 * Estratégia que agrupa os arquivos por diretório
 * Mostra um resumo de quantos arquivos foram alterados em cada diretório
 */
export class DirectorySummaryStrategy implements AnalysisStrategy {
    /**
     * Analisa os arquivos e gera um resumo agrupado por diretório
     * @param files - Array de objetos contendo status e caminho dos arquivos
     * @returns String formatada com o resumo por diretório
     */
    analyze(files: Array<{ status: string; file: string }>): string {
        const filesByDir = this.groupFilesByDirectory(files);
        let message = '\nResumo por diretório:\n';
        
        Object.entries(filesByDir).forEach(([dir, files]) => {
            const dirName = dir === '.' ? 'raiz' : dir;
            message += `\n${dirName}/ (${files.length} arquivo(s)):\n`;
            files.forEach(file => {
                message += `  - ${file}\n`;
            });
        });
        
        return message;
    }

    /**
     * Agrupa os arquivos por diretório, ignorando o status
     * @param files - Array de objetos contendo status e caminho dos arquivos
     * @returns Objeto com diretórios como chaves e arrays de nomes de arquivos como valores
     */
    private groupFilesByDirectory(files: Array<{ status: string; file: string }>): Record<string, string[]> {
        return files.reduce((acc, { file }) => {
            const dir = path.dirname(file) || '.';
            if (!acc[dir]) {
                acc[dir] = [];
            }
            acc[dir].push(path.basename(file));
            return acc;
        }, {} as Record<string, string[]>);
    }
}

/**
 * Estratégia que conta e resume os tipos de alteração
 * Mostra quantos arquivos foram modificados, adicionados, deletados, etc
 */
export class TypeSummaryStrategy implements AnalysisStrategy {
    /**
     * Analisa os arquivos e gera um resumo dos tipos de alteração
     * @param files - Array de objetos contendo status e caminho dos arquivos
     * @returns String formatada com o resumo dos tipos de alteração
     */
    analyze(files: Array<{ status: string; file: string }>): string {
        const statusTypes = this.countStatusTypes(files);
        let message = '\nTipos de alteração:\n';
        
        Object.entries(statusTypes).forEach(([status, count]) => {
            const statusDesc = this.getStatusDescription(status);
            message += `- ${count} arquivo(s) ${statusDesc}\n`;
        });
        
        return message;
    }

    /**
     * Conta quantos arquivos existem para cada tipo de status
     * @param files - Array de objetos contendo status e caminho dos arquivos
     * @returns Objeto com status como chaves e contagem como valores
     */
    private countStatusTypes(files: Array<{ status: string; file: string }>): Record<string, number> {
        return files.reduce((acc, { status }) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Converte o código de status do git para uma descrição em português
     * @param status - Código de status do git (M, A, D, R, ??)
     * @returns Descrição do status em português
     */
    private getStatusDescription(status: string): string {
        const descriptions = {
            'M': 'modificado',
            'A': 'adicionado',
            'D': 'deletado',
            'R': 'renomeado',
            '??': 'não rastreado'
        };
        return descriptions[status] || status;
    }
} 

/**
 * Estratégia que gera uma mensagem de commit usando IA e o padrão estabelecido via JSON

 */