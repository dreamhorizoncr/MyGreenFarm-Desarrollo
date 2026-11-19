import { createContext, useContext } from "react";

/** Text size chosen in the accessibility menu. */
export type FontSize = "normal" | "large" | "xlarge";
/** Color filter chosen in the accessibility menu. */
export type ColorMode = "normal" | "monochrome" | "low-saturation" | "high-saturation";

/** Options of the accessibility menu and their setters. Each option is kept in `localStorage`. */
export interface AccessibilityContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    highContrast: boolean;
    toggleHighContrast: () => void;
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
    highlightLinks: boolean;
    toggleHighlightLinks: () => void;
    dyslexiaFont: boolean;
    toggleDyslexiaFont: () => void;
    textSpacing: boolean;
    toggleTextSpacing: () => void;
    bigCursor: boolean;
    toggleBigCursor: () => void;
    readingGuide: boolean;
    toggleReadingGuide: () => void;
    stopAnimations: boolean;
    toggleStopAnimations: () => void;
    voiceReader: boolean;
    toggleVoiceReader: () => void;
    autoReadModals: boolean;
    toggleAutoReadModals: () => void;
    announceAlerts: boolean;
    toggleAnnounceAlerts: () => void;
    clickToRead: boolean;
    toggleClickToRead: () => void;
    readFocus: boolean;
    toggleReadFocus: () => void;
    resetAccessibility: () => void;
}

/** Context of {@link AccessibilityProvider}. */
export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * @returns the options of the accessibility menu
 * @throws Error if it is used outside {@link AccessibilityProvider}
 */
export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility must be used inside an AccessibilityProvider");
    }
    return context;
}
