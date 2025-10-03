import { useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessMessage, MessageHistory, MessageInput } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type MessageErrorType = "load" | "create" | "update" | "delete";

type ApiMessage = BusinessMessage & { history?: MessageHistory[] };

type MessageState = {
  messages: BusinessMessage[];
  history: Record<string, MessageHistory[]>;
};

const initialState: MessageState = {
  messages: [],
  history: {},
};

export const useMessages = (language?: string) => {
  const [state, setState] = useState<MessageState>(initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<MessageErrorType | null>(null);

  const fetchMessages = useCallback(async () => {
    // Verifica se o usuário está autenticado antes de buscar mensagens
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      setState(initialState);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (language) {
        params.set("language", language);
      }
      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/messages${query ? `?${query}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const data: ApiMessage[] = await response.json();
      const history: Record<string, MessageHistory[]> = {};
      const messages: BusinessMessage[] = data.map(
        ({ history: historyEntries = [], ...messageFields }) => {
          history[messageFields.id] = historyEntries;
          return messageFields;
        }
      );
      setState({ messages, history });
    } catch (err) {
      console.error(err);
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    // Verifica se o usuário está autenticado antes de buscar mensagens
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      void fetchMessages();
    }
  }, [fetchMessages]);

  const createMessage = useCallback(
    async (payload: MessageInput) => {
      setLoading(true);
      setError(null);
      try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_key: payload.message_key,
          translations: payload.translations,
          variables: payload.variables,
          http_status: payload.http_status,
          updated_by: payload.updated_by,
        }),
      });
        if (!response.ok) {
          throw new Error("Failed to create message");
        }
        await fetchMessages();
      } catch (err) {
        console.error(err);
        setError("create");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMessages]
  );

  const updateMessage = useCallback(
    async (id: string, payload: MessageInput) => {
      setLoading(true);
      setError(null);
      try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_key: payload.message_key,
          translations: payload.translations,
          variables: payload.variables,
          http_status: payload.http_status,
          updated_by: payload.updated_by,
        }),
      });
        if (!response.ok) {
          throw new Error("Failed to update message");
        }
        await fetchMessages();
      } catch (err) {
        console.error(err);
        setError("update");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMessages]
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete message");
        }
        await fetchMessages();
      } catch (err) {
        console.error(err);
        setError("delete");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMessages]
  );

  const value = useMemo(
    () => ({
      messages: state.messages,
      history: state.history,
      loading,
      error,
      createMessage,
      updateMessage,
      deleteMessage,
      refresh: fetchMessages,
    }),
    [
      state,
      loading,
      error,
      createMessage,
      updateMessage,
      deleteMessage,
      fetchMessages,
    ]
  );

  return value;
};
