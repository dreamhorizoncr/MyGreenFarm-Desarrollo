import { createContext, useContext } from "react";

export type FontSize = "normal" | "large" | "xlarge";
export type ColorMode = "normal" | "monochrome" | "low-saturation" | "high-saturation";

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

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility debe usarse dentro de un AccessibilityProvider");
    }
    return context;
}
