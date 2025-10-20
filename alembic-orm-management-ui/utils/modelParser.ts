import { ModelDefinition, ModelField } from '../types';

// Função para extrair campos de um bloco de código de uma classe
const extractFields = (classBody: string): ModelField[] => {
    const fields: ModelField[] = [];
    const fieldRegex = /(\w+)\s*:\s*Mapped\[(.+?)\]\s*=\s*mapped_column\(([\s\S]*?)\)/g;

    let match;
    while ((match = fieldRegex.exec(classBody)) !== null) {
        const name = match[1];
        let type = match[2].replace(/"/g, ''); // Limpa aspas do tipo
        
        const argsContent = match[3].split(',').map(arg => arg.trim().replace(/\s*\)/, ''));
        const firstArg = argsContent[0];
        
        // Verifica se o primeiro argumento não é uma chave=valor, assumindo que seja o tipo
        if (!firstArg.includes('=')) {
            type = firstArg; // O tipo real está como primeiro argumento de mapped_column
        }

        const options = argsContent
            .slice(firstArg.includes('=') ? 0 : 1) // Pula o primeiro argumento se ele for o tipo
            .filter(arg => arg) // Filtra strings vazias
            .map(opt => opt.replace(/,$/, '').trim()); // Limpa vírgulas e espaços

        fields.push({ name, type, options });
    }
    return fields;
};

// Função principal para interpretar o código Python e extrair modelos
export const parseModels = (pythonCode: string): ModelDefinition[] => {
    const models: ModelDefinition[] = [];
    // Regex para encontrar classes que herdam de 'Base'
    const classRegex = /class\s+(\w+)\(Base\):([\s\S]*?)(?=\nclass|\n\n\w|#|$)/g;
    
    let match;
    while ((match = classRegex.exec(pythonCode)) !== null) {
        const name = match[1];
        const body = match[2];
        
        const fields = extractFields(body);

        // Adiciona apenas se a classe tiver campos definidos com mapped_column
        if (fields.length > 0) {
            models.push({
                name,
                type: 'SQLAlchemy',
                fields,
            });
        }
    }
    
    return models;
};
