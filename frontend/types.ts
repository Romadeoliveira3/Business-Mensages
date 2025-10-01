
export interface BusinessMessage {
    id: string;
    message_key: string;
    version: number;
    title: string;
    body: string;
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
    title: string;
    body: string;
    variables: string[];
    http_status?: number;
    updated_by: string;
}
