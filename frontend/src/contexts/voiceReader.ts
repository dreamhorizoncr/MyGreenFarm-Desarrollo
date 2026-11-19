import { createContext, useContext } from "react";

/** Screen reader built into the site: reads the page, a dialog, an element or a text aloud. */
export interface VoiceReaderContextValue {
  /** Whether the browser supports speech synthesis. */
  supported: boolean;
  isSpeaking: boolean;
  /** Reads the open dialog, or the page when there is none. */
  readCurrentView: () => void;
  readElement: (element: HTMLElement) => void;
  /** Reads the text the user has selected. */
  readSelection: () => void;
  /** Announces the element that just got the focus. */
  readFocusTarget: (element: HTMLElement) => void;
  speakText: (text: string) => void;
  stop: () => void;
}

/** Context of {@link VoiceReaderProvider}. */
export const VoiceReaderContext = createContext<VoiceReaderContextValue | undefined>(undefined);

/**
 * @returns the voice reader provided by {@link VoiceReaderProvider}
 * @throws Error if it is used outside {@link VoiceReaderProvider}
 */
export function useVoiceReader(): VoiceReaderContextValue {
  const context = useContext(VoiceReaderContext);
  if (!context) {
    throw new Error("useVoiceReader must be used inside a VoiceReaderProvider");
  }
  return context;
}
