import * as path from 'path';

export interface AnalysisStrategy {
    analyze(files: Array<{ status: string; file: string }>): string;
}

export class FileListStrategy implements AnalysisStrategy {
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

export class DirectorySummaryStrategy implements AnalysisStrategy {
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

export class TypeSummaryStrategy implements AnalysisStrategy {
    analyze(files: Array<{ status: string; file: string }>): string {
        const statusTypes = this.countStatusTypes(files);
        let message = '\nTipos de alteração:\n';
        
        Object.entries(statusTypes).forEach(([status, count]) => {
            const statusDesc = this.getStatusDescription(status);
            message += `- ${count} arquivo(s) ${statusDesc}\n`;
        });
        
        return message;
    }

    private countStatusTypes(files: Array<{ status: string; file: string }>): Record<string, number> {
        return files.reduce((acc, { status }) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

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