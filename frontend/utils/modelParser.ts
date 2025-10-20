import { ModelDefinition, ModelField } from '../types';

const extractFields = (classBody: string): ModelField[] => {
    const fields: ModelField[] = [];
    const fieldRegex = /(\w+)\s*:\s*Mapped\[(.+?)\]\s*=\s*mapped_column\(([\s\S]*?)\)/g;

    let match;
    while ((match = fieldRegex.exec(classBody)) !== null) {
        const name = match[1];
        let type = match[2].replace(/"/g, '');
        
        const argsContent = match[3].split(',').map(arg => arg.trim().replace(/\s*\)/, ''));
        const firstArg = argsContent[0];
        
        if (!firstArg.includes('=')) {
            type = firstArg;
        }

        const options = argsContent
            .slice(firstArg.includes('=') ? 0 : 1)
            .filter(arg => arg)
            .map(opt => opt.replace(/,$/, '').trim());

        fields.push({ name, type, options });
    }
    return fields;
};

export const parseModels = (pythonCode: string): ModelDefinition[] => {
    const models: ModelDefinition[] = [];
    const classRegex = /class\s+(\w+)\(Base\):([\s\S]*?)(?=\nclass|\n\n\w|#|$)/g;
    
    let match;
    while ((match = classRegex.exec(pythonCode)) !== null) {
        const name = match[1];
        const body = match[2];
        
        const fields = extractFields(body);

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

