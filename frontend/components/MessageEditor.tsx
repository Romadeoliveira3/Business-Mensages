import React, { useState, useEffect, useMemo } from "react";
import { BusinessMessage, MessageInput, MessageHistory } from "../types";
import MessageHistoryModal from "./MessageHistoryModal";
import { HistoryIcon } from "./icons/HistoryIcon";
import Tooltip from "./Tooltip";
import { useLocalization } from "../contexts/LocalizationContext";

interface MessageEditorProps {
  message: BusinessMessage | null;
  history: MessageHistory[];
  onSave: (message: MessageInput) => Promise<void> | void;
  onClose: () => void;
}

const HighlightedBody: React.FC<{ body: string }> = ({ body }) => {
  try {
    const jsonObj = JSON.parse(body);
    return (
      <pre className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-x-auto">
        <code>{JSON.stringify(jsonObj, null, 2)}</code>
      </pre>
    );
  } catch (e) {
    const parts = body.split(/(\{[a-zA-Z0-9_]+\})/g);
    return (
      <p className="text-sm">
        {parts.map((part, i) =>
          /\{[a-zA-Z0-9_]+\}/.test(part) ? (
            <span
              key={i}
              className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 font-mono rounded px-1"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </p>
    );
  }
};

const defaultFormState: Omit<MessageInput, "id"> = {
  message_key: "",
  title: "",
  body: "",
  variables: [],
  http_status: undefined,
  updated_by: "admin@example.com",
};

const MessageEditor: React.FC<MessageEditorProps> = ({
  message,
  history,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Omit<MessageInput, "id">>({
    ...defaultFormState,
  });
  // Estado separado para o campo de texto de variáveis, facilitando a digitação
  const [variablesInput, setVariablesInput] = useState("");
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const { t } = useLocalization();

  useEffect(() => {
    if (message) {
      setFormData({
        message_key: message.message_key,
        title: message.title,
        body: message.body,
        variables: message.variables,
        http_status: message.http_status || undefined,
        updated_by: message.updated_by,
      });
      // Define o valor do campo de entrada de variáveis quando uma mensagem é carregada
      setVariablesInput(message.variables.join(","));
    } else {
      setFormData({ ...defaultFormState });
      setVariablesInput("");
    }
  }, [message]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "http_status") {
      setFormData((prev) => ({
        ...prev,
        http_status: value ? parseInt(value, 10) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Atualiza o estado do campo de texto diretamente para uma experiência melhor de digitação
    setVariablesInput(inputValue);

    // Processa as variáveis apenas quando há conteúdo
    if (!inputValue.trim()) {
      setFormData((prev) => ({ ...prev, variables: [] }));
      return;
    }

    // Divide por vírgulas, remove espaços em branco extras e filtra entradas vazias
    const vars = inputValue
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "");

    setFormData((prev) => ({ ...prev, variables: vars }));
  };

  const handleSampleValueChange = (variable: string, value: string) => {
    setSampleValues((prev) => ({ ...prev, [variable]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...formData,
      id: message?.id,
    });
  };

  const interpolatedPreview = useMemo(() => {
    let previewBody = formData.body;

    // Verificar se as variáveis foram definidas e processadas corretamente
    if (!formData.variables || formData.variables.length === 0) {
      return previewBody;
    }

    try {
      // Tenta processar como JSON
      JSON.parse(previewBody);
      for (const variable of formData.variables) {
        if (!variable) continue; // Pula variáveis vazias

        const regex = new RegExp(`"{${variable}}"`, "g");
        previewBody = previewBody.replace(
          regex,
          `"${sampleValues[variable] || `{${variable}}`}"`
        );
      }
    } catch (e) {
      // Processa como texto simples
      for (const variable of formData.variables) {
        if (!variable) continue; // Pula variáveis vazias

        const regex = new RegExp(`\\{${variable}\\}`, "g");
        previewBody = previewBody.replace(
          regex,
          sampleValues[variable] || `{${variable}}`
        );
      }
    }
    return previewBody;
  }, [formData.body, formData.variables, sampleValues]);

  const placeholdersInBody = useMemo(() => {
    // Extrai todos os placeholders no formato {placeholder} do corpo da mensagem
    const matches = formData.body.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    // Remove as chaves e cria um Set para garantir valores únicos
    return new Set(matches.map((p) => p.slice(1, -1)));
  }, [formData.body]);

  const undeclaredVariables = useMemo(
    () =>
      [...placeholdersInBody].filter((p) => !formData.variables.includes(p)),
    [placeholdersInBody, formData.variables]
  );

  const editorTitle = message
    ? t("editor.title.edit", { key: message.message_key })
    : t("editor.title.create");

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg relative">
      <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {editorTitle}
        </h1>
        {message && (
          <button
            onClick={() => setIsHistoryVisible(true)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 font-semibold"
          >
            <HistoryIcon className="w-5 h-5" />{" "}
            {t("editor.versionHistoryButton")}
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.fields.key.label")}
              </label>
              <Tooltip
                text={t("editor.fields.key.tooltipText")}
                example={t("editor.fields.key.tooltipExample")}
              />
            </div>
            <input
              type="text"
              name="message_key"
              value={formData.message_key}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.fields.title.label")}
              </label>
              <Tooltip
                text={t("editor.fields.title.tooltipText")}
                example={t("editor.fields.title.tooltipExample")}
              />
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.fields.body.label")}
              </label>
              <Tooltip
                text={t("editor.fields.body.tooltipText")}
                example={t("editor.fields.body.tooltipExample")}
              />
            </div>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              rows={8}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono"
            ></textarea>
            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                {t("editor.preview.formatted")}:
              </p>
              <HighlightedBody body={formData.body} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.fields.variables.label")}
              </label>
              <Tooltip
                text={t("editor.fields.variables.tooltipText")}
                example={t("editor.fields.variables.tooltipExample")}
              />
            </div>
            <input
              type="text"
              name="variables"
              value={variablesInput}
              onChange={handleVariablesChange}
              placeholder="variavel1,variavel2,variavel3"
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono"
            />
          </div>
          {undeclaredVariables.length > 0 && (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-md text-sm">
              <strong>{t("editor.warning.title")}:</strong>{" "}
              {t("editor.warning.undeclaredVariables")}{" "}
              {undeclaredVariables.join(", ")}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.fields.httpStatus.label")}
              </label>
              <Tooltip
                text={t("editor.fields.httpStatus.tooltipText")}
                example={t("editor.fields.httpStatus.tooltipExample")}
              />
            </div>
            <input
              type="number"
              name="http_status"
              value={formData.http_status || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {t("editor.preview.live")}
          </h3>
          <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-lg space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                {t("editor.preview.sampleVariables")}
              </h4>
              {formData.variables.length > 0 ? (
                formData.variables.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <label className="w-1/3 text-sm font-mono text-slate-600 dark:text-slate-300">{`{${v}}`}</label>
                    <input
                      type="text"
                      placeholder={t("editor.preview.sampleInputPlaceholder", {
                        variable: v,
                      })}
                      value={sampleValues[v] || ""}
                      onChange={(e) =>
                        handleSampleValueChange(v, e.target.value)
                      }
                      className="w-2/3 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("editor.preview.noVariables")}
                </p>
              )}
            </div>
            <div className="border-t border-slate-300 dark:border-slate-600 pt-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                {t("editor.preview.interpolatedMessage")}
              </h4>
              <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-md shadow-inner">
                <p className="font-bold text-lg text-slate-900 dark:text-slate-50">
                  {formData.title}
                </p>
                <div className="mt-1 text-slate-700 dark:text-slate-300">
                  <HighlightedBody body={interpolatedPreview} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            {message ? t("common.saveChanges") : t("common.createMessage")}
          </button>
        </div>
      </form>

      {message && (
        <MessageHistoryModal
          isVisible={isHistoryVisible}
          onClose={() => setIsHistoryVisible(false)}
          history={history}
          messageKey={message.message_key}
        />
      )}
    </div>
  );
};

export default MessageEditor;
