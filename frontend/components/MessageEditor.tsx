import React, { useEffect, useMemo, useState } from "react";
import { BusinessMessage, MessageInput, MessageTranslation } from "../types";
import { useLocalization } from "../contexts/LocalizationContext";

interface MessageEditorProps {
  message: BusinessMessage | null;
  onSave: (message: MessageInput) => Promise<void> | void;
  onClose: () => void;
}

const DEFAULT_LANGUAGE = "pt-BR";
const ALLOWED_LANGUAGES = ["pt-BR", "en", "es"] as const;

const createEmptyTranslation = (language_code: string): MessageTranslation => ({
  language_code,
  title: "",
});

const defaultMetadata = {
  message_key: "",
  code: "",
};

const MessageEditor: React.FC<MessageEditorProps> = ({ message, onSave, onClose }) => {
  const { t } = useLocalization();
  const [metadata, setMetadata] = useState(defaultMetadata);
  const [translationValues, setTranslationValues] = useState<
    Record<string, MessageTranslation>
  >({
    "pt-BR": createEmptyTranslation("pt-BR"),
    en: createEmptyTranslation("en"),
    es: createEmptyTranslation("es"),
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE);

  useEffect(() => {
    if (message) {
      const translationMap: Record<string, MessageTranslation> = {};
      for (const translation of message.translations) {
        translationMap[translation.language_code] = { ...translation };
      }
      for (const code of ALLOWED_LANGUAGES) {
        if (!translationMap[code]) {
          translationMap[code] = createEmptyTranslation(code);
        }
      }
      setTranslationValues(translationMap);
      setMetadata({
        message_key: message.message_key,
        code: message.code,
      });
      const preferred = message.selected_language && translationMap[message.selected_language]
        ? message.selected_language
        : message.available_languages[0] || DEFAULT_LANGUAGE;
      setSelectedLanguage(preferred);
    } else {
      setMetadata({ ...defaultMetadata });
      setTranslationValues({
        "pt-BR": createEmptyTranslation("pt-BR"),
        en: createEmptyTranslation("en"),
        es: createEmptyTranslation("es"),
      });
      setSelectedLanguage(DEFAULT_LANGUAGE);
    }
  }, [message]);

  const currentTranslation = translationValues[selectedLanguage] ??
    createEmptyTranslation(selectedLanguage);

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleTitleChange = (value: string) => {
    setTranslationValues((prev) => ({
      ...prev,
      [selectedLanguage]: {
        ...createEmptyTranslation(selectedLanguage),
        ...prev[selectedLanguage],
        title: value,
      },
    }));
  };

  const handleSelectLanguage = (code: string) => {
    setTranslationValues((prev) => {
      if (prev[code]) {
        return prev;
      }
      return {
        ...prev,
        [code]: createEmptyTranslation(code),
      };
    });
    setSelectedLanguage(code);
  };

  const preparedTranslations = useMemo(
    () =>
      Object.values(translationValues)
        .filter((translation) => translation.title.trim())
        .map((translation) => ({
          language_code: translation.language_code,
          title: translation.title.trim(),
        })),
    [translationValues],
  );

  const canSave = useMemo(() => {
    return (
      metadata.message_key.trim().length > 0 &&
      metadata.code.trim().length > 0 &&
      preparedTranslations.length > 0
    );
  }, [metadata, preparedTranslations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      return;
    }

    await onSave({
      id: message?.id,
      message_key: metadata.message_key.trim(),
      code: metadata.code.trim(),
      translations: preparedTranslations,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {message ? t("editor.editMessage") : t("editor.newMessage")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("editor.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("editor.messageKey")}
                </span>
                <input
                  type="text"
                  name="message_key"
                  value={metadata.message_key}
                  onChange={handleMetadataChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("editor.code")}
                </span>
                <input
                  type="text"
                  name="code"
                  value={metadata.code}
                  onChange={handleMetadataChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                />
              </label>
            </div>

            <div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("editor.languages")}
              </span>
              <div className="mt-2 flex gap-2 flex-wrap">
                {ALLOWED_LANGUAGES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectLanguage(code)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      selectedLanguage === code
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
                        : "border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-600 dark:border-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("editor.title")}
                </span>
                <input
                  type="text"
                  value={currentTranslation.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white transition ${
                canSave
                  ? "bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  : "bg-slate-300 cursor-not-allowed dark:bg-slate-600"
              }`}
            >
              {message ? t("common.saveChanges") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageEditor;
