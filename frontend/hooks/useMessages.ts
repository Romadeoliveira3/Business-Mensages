import { useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessMessage, MessageInput } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type MessageErrorType = "load" | "create" | "update" | "delete";

type MessageState = {
  messages: BusinessMessage[];
};

const initialState: MessageState = {
  messages: [],
};

export const useMessages = (language?: string) => {
  const [state, setState] = useState<MessageState>(initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<MessageErrorType | null>(null);

  const fetchMessages = useCallback(async () => {
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
      const data: BusinessMessage[] = await response.json();
      setState({ messages: data });
    } catch (err) {
      console.error(err);
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
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
            code: payload.code,
            translations: payload.translations,
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
            code: payload.code,
            translations: payload.translations,
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
      loading,
      error,
      createMessage,
      updateMessage,
      deleteMessage,
      refresh: fetchMessages,
    }),
    [state, loading, error, createMessage, updateMessage, deleteMessage, fetchMessages]
  );

  return value;
};
