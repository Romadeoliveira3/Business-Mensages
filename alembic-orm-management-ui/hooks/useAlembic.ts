import { useState, useCallback } from 'react';
import { Migration } from '../types';
import * as api from '../services/api';

export const useAlembic = () => {
    const [migrations, setMigrations] = useState<Migration[]>([]);
    const [loading, setLoading] = useState(false);
    const [head, setHead] = useState<string | null>(null);
    const [current, setCurrent] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getMigrations();
            setMigrations(data.migrations);
            setHead(data.head);
            setCurrent(data.current);
        } catch (error) {
            console.error("Failed to fetch migrations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const executeAndRefresh = useCallback(async (action: () => Promise<unknown>, operationName: string) => {
        console.log(`${operationName}...`);
        setLoading(true);
        try {
            await action();
            await fetchData(); // Refresh data from the source of truth
        } catch (error) {
            console.error(`Failed to ${operationName}:`, error);
        } finally {
            // fetchData already sets loading to false
        }
    }, [fetchData]);

    const upgrade = (revision: string) => {
        console.log(`Upgrading to ${revision}...`);
        setCurrent(revision); // This is a client-side state change, representing the target version
    };

    const downgrade = (revision: string) => {
        console.log(`Downgrading to ${revision}...`);
        setCurrent(revision);
    };

    const upgradeToHead = () => {
        if (head) {
            upgrade(head);
        }
    };

    const autogenerate = (message: string) => {
        executeAndRefresh(() => api.createMigration(message, 'autogenerate'), 'Autogenerating migration');
    };

    const createEmpty = (message: string) => {
        executeAndRefresh(() => api.createMigration(message, 'empty'), 'Creating empty migration');
    };

    const updateMessage = (id: string, message: string) => {
         console.log(`Updating message for ${id}...`);
         // Optimistic update for better UX
         setMigrations(prev => prev.map(m => m.id === id ? { ...m, message } : m));
         
         // Call API in the background
         api.updateMigrationMessage(id, message).catch(err => {
             console.error("Failed to update message, reverting:", err);
             fetchData(); // Revert on failure
         });
    };

    return {
        migrations,
        loading,
        head,
        current,
        upgrade,
        downgrade,
        upgradeToHead,
        autogenerate,
        createEmpty,
        updateMessage,
        fetchData,
    };
};
