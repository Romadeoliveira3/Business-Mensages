
export interface MessageTranslation {
    language_code: string;
    title: string;
    body: string;
}

export interface BusinessMessage {
    id: string;
    message_key: string;
    version: number;
    title: string;
    body: string;
    selected_language?: string | null;
    available_languages: string[];
    translations: MessageTranslation[];
    variables: string[];
    http_status?: number;
    created_at: string;
    updated_at: string;
    updated_by: string;
}

export interface MessageHistory {
    version: number;
    updated_at: string;
    updated_by: string;
    changes: string;
}

export interface MessageInput {
    id?: string;
    message_key: string;
    translations: MessageTranslation[];
    variables: string[];
    http_status?: number;
    updated_by: string;
}
