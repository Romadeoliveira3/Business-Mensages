export interface MessageTranslation {
    language_code: string;
    title: string;
}

export interface BusinessMessage {
    id: string;
    message_key: string;
    code: string;
    title: string;
    selected_language?: string | null;
    available_languages: string[];
    translations: MessageTranslation[];
}

export interface MessageInput {
    id?: string;
    message_key: string;
    code: string;
    translations: MessageTranslation[];
}
