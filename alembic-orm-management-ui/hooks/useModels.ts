import { useState, useCallback } from 'react';
import { ModelDefinition } from '../types';
import * as api from '../services/api';

export const useModels = () => {
    const [models, setModels] = useState<ModelDefinition[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchModels = useCallback(async (directoryPath: string) => {
        setLoading(true);
        console.log(`Fetching and parsing models from directory ${directoryPath}...`);
        
        try {
            const parsedModels = await api.getModels(directoryPath);
            setModels(parsedModels);
        } catch (error) {
            console.error("Failed to fetch or parse models:", error);
            setModels([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { models, loading, fetchModels };
};
