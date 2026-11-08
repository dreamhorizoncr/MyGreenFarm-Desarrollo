import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSpeechReader } from "../hooks/useSpeechReader";
import {
  getDialogBlocks,
  getFocusAnnouncement,
  getPageBlocks,
  getReadableBlocks,
  getTopDialog,
  type ReadableFocusLabels,
} from "../utils/readableContent";

interface VoiceReaderContextValue {
  supported: boolean;
  isSpeaking: boolean;
  readCurrentView: () => void;
  readElement: (element: HTMLElement) => void;
  readSelection: () => void;
  readFocusTarget: (element: HTMLElement) => void;
  speakText: (text: string) => void;
  stop: () => void;
}

const VoiceReaderContext = createContext<VoiceReaderContextValue | undefined>(undefined);

function isDialogElement(element: HTMLElement) {
  return (
    element instanceof HTMLDialogElement ||
    element.getAttribute("role") === "dialog" ||
    element.getAttribute("aria-modal") === "true"
  );
}

export function VoiceReaderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { i18n, t } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || "es").slice(0, 2);
  const { supported, isSpeaking, speakBlocks, speakText, stop } = useSpeechReader(language);

  useEffect(() => {
    stop();
  }, [language, stop]);

  const controlLabels = useMemo<ReadableFocusLabels>(
    () => ({
      checked: t("accessibility.readerChecked", { defaultValue: "activado" }),
      unchecked: t("accessibility.readerUnchecked", { defaultValue: "desactivado" }),
      selected: t("accessibility.readerSelected"),
      notSelected: t("accessibility.readerNotSelected"),
      empty: t("accessibility.readerEmpty"),
      password: t("accessibility.readerPassword"),
      roleLink: t("accessibility.roleLink"),
      roleButton: t("accessibility.roleButton"),
      roleCheckbox: t("accessibility.roleCheckbox"),
      roleRadio: t("accessibility.roleRadio"),
      roleSwitch: t("accessibility.roleSwitch", { defaultValue: "interruptor" }),
      roleTab: t("accessibility.roleTab"),
      roleMenuItem: t("accessibility.roleMenuItem"),
      roleOption: t("accessibility.roleOption"),
      roleTextBox: t("accessibility.roleTextBox"),
      roleSearchBox: t("accessibility.roleSearchBox"),
      roleComboBox: t("accessibility.roleComboBox"),
      roleSlider: t("accessibility.roleSlider", { defaultValue: "control deslizante" }),
      roleSummary: t("accessibility.roleSummary", { defaultValue: "detalles" }),
      expanded: t("accessibility.readerExpanded"),
      collapsed: t("accessibility.readerCollapsed"),
      pressed: t("accessibility.readerPressed", { defaultValue: "presionado" }),
      notPressed: t("accessibility.readerNotPressed", { defaultValue: "no presionado" }),
      disabled: t("accessibility.readerDisabled", { defaultValue: "deshabilitado" }),
      required: t("accessibility.readerRequired", { defaultValue: "obligatorio" }),
    }),
    [t],
  );

  const readElement = useCallback(
    (element: HTMLElement) => {
      const blocks = isDialogElement(element)
        ? getDialogBlocks(element, { controlLabels })
        : getReadableBlocks(element, { controlLabels });
      void speakBlocks(blocks);
    },
    [controlLabels, speakBlocks],
  );

  const readCurrentView = useCallback(() => {
    const dialog = getTopDialog();
    const blocks = dialog
      ? getDialogBlocks(dialog, { controlLabels })
      : getPageBlocks({ controlLabels });
    void speakBlocks(blocks);
  }, [controlLabels, speakBlocks]);

  const readSelection = useCallback(() => {
    const selection = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (selection) speakText(selection);
  }, [speakText]);

  const readFocusTarget = useCallback(
    (element: HTMLElement) => {
      const text = getFocusAnnouncement(element, controlLabels);
      if (text) speakText(text);
    },
    [controlLabels, speakText],
  );

  const value = useMemo<VoiceReaderContextValue>(
    () => ({
      supported,
      isSpeaking,
      readCurrentView,
      readElement,
      readSelection,
      readFocusTarget,
      speakText,
      stop,
    }),
    [supported, isSpeaking, readCurrentView, readElement, readSelection, readFocusTarget, speakText, stop],
  );

  return <VoiceReaderContext.Provider value={value}>{children}</VoiceReaderContext.Provider>;
}

export function useVoiceReader() {
  const context = useContext(VoiceReaderContext);
  if (!context) {
    throw new Error("useVoiceReader must be used inside a VoiceReaderProvider");
  }
  return context;
}
