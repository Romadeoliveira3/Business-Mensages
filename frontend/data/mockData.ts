import type { BusinessMessage } from "../types";

const existingMessages: BusinessMessage[] = [
  {
    id: "msg_1",
    message_key: "user.duplicated",
    code: "MSG-001",
    title: "Usuário Duplicado",
    selected_language: "pt-BR",
    available_languages: ["pt-BR", "en"],
    translations: [
      {
        language_code: "pt-BR",
        title: "Usuário Duplicado",
      },
      {
        language_code: "en",
        title: "User Already Exists",
      },
    ],
  },
  {
    id: "msg_2",
    message_key: "order.expired",
    code: "MSG-002",
    title: "Pedido Expirado",
    selected_language: "pt-BR",
    available_languages: ["pt-BR", "en"],
    translations: [
      {
        language_code: "pt-BR",
        title: "Pedido Expirado",
      },
      {
        language_code: "en",
        title: "Order Expired",
      },
    ],
  },
];

export const initialMessages: BusinessMessage[] = existingMessages;

