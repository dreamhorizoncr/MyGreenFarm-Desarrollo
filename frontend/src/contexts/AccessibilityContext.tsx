import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionGlobalConfig } from "motion/react";
import { notifyReducedMotionChange } from "../utils/reducedMotion";
import { AccessibilityContext, type AccessibilityContextType, type ColorMode, type FontSize } from "./accessibility";

const COLOR_MODES = new Set<string>(["normal", "monochrome", "low-saturation", "high-saturation"]);

function persistFlag(key: string, enabled: boolean) {
    localStorage.setItem(key, String(enabled));
}

function applyFlag(root: HTMLElement, className: string, key: string, enabled: boolean) {
    root.classList.toggle(className, enabled);
    persistFlag(key, enabled);
}

function applyColorMode(root: HTMLElement, colorMode: ColorMode) {
    root.classList.remove("grayscale-mode", "color-monochrome", "color-low-saturation", "color-high-saturation", "color-normal");
    if (colorMode === "normal") {
        localStorage.removeItem("a11y_color_mode");
    } else {
        root.classList.add(`color-${colorMode}`);
        localStorage.setItem("a11y_color_mode", colorMode);
    }
    // Legacy key: removed so the old mode is not reactivated.
    localStorage.removeItem("a11y_grayscale");
}

function readBoolean(key: string, fallback = false) {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "true";
}

function readColorMode(): ColorMode {
    const saved = localStorage.getItem("a11y_color_mode");
    if (saved && COLOR_MODES.has(saved)) return saved as ColorMode;
    // Migrate from the old grayscale toggle.
    if (localStorage.getItem("a11y_grayscale") === "true") return "monochrome";
    return "normal";
}

export function AccessibilityProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        return (localStorage.getItem("a11y_font") as FontSize) || "normal";
    });

    const [highContrast, setHighContrast] = useState<boolean>(() => {
        return localStorage.getItem("a11y_contrast") === "true";
    });

    const [colorMode, setColorMode] = useState<ColorMode>(readColorMode);

    const [highlightLinks, setHighlightLinks] = useState<boolean>(() => {
        return localStorage.getItem("a11y_links") === "true";
    });

    const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(() => readBoolean("a11y_dyslexia"));
    const [textSpacing, setTextSpacing] = useState<boolean>(() => readBoolean("a11y_text_spacing"));
    const [bigCursor, setBigCursor] = useState<boolean>(() => readBoolean("a11y_big_cursor"));
    const [readingGuide, setReadingGuide] = useState<boolean>(() => readBoolean("a11y_reading_guide"));
    const [stopAnimations, setStopAnimations] = useState<boolean>(() => readBoolean("a11y_stop_animations"));

    const [voiceReader, setVoiceReader] = useState<boolean>(() => readBoolean("a11y_voice_reader"));
    const [autoReadModals, setAutoReadModals] = useState<boolean>(() => readBoolean("a11y_reader_modals", true));
    const [announceAlerts, setAnnounceAlerts] = useState<boolean>(() => readBoolean("a11y_reader_alerts", true));
    const [clickToRead, setClickToRead] = useState<boolean>(() => readBoolean("a11y_reader_click", true));
    const [readFocus, setReadFocus] = useState<boolean>(() => readBoolean("a11y_reader_focus", true));

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("text-normal", "text-large", "text-xlarge");
        root.classList.add(`text-${fontSize}`);
        localStorage.setItem("a11y_font", fontSize);

        applyFlag(root, "high-contrast", "a11y_contrast", highContrast);
        applyColorMode(root, colorMode);
        applyFlag(root, "highlight-links-mode", "a11y_links", highlightLinks);
        applyFlag(root, "dyslexia-font", "a11y_dyslexia", dyslexiaFont);
        applyFlag(root, "text-spacing-mode", "a11y_text_spacing", textSpacing);
        applyFlag(root, "big-cursor", "a11y_big_cursor", bigCursor);
        applyFlag(root, "reading-guide-mode", "a11y_reading_guide", readingGuide);

        root.classList.toggle("stop-animations-mode", stopAnimations);
        MotionGlobalConfig.skipAnimations = stopAnimations;
        notifyReducedMotionChange();
        persistFlag("a11y_stop_animations", stopAnimations);

        applyFlag(root, "voice-reader-mode", "a11y_voice_reader", voiceReader);

        persistFlag("a11y_reader_modals", autoReadModals);
        persistFlag("a11y_reader_alerts", announceAlerts);
        persistFlag("a11y_reader_click", clickToRead);
        persistFlag("a11y_reader_focus", readFocus);
    }, [
        fontSize,
        highContrast,
        colorMode,
        highlightLinks,
        dyslexiaFont,
        textSpacing,
        bigCursor,
        readingGuide,
        stopAnimations,
        voiceReader,
        autoReadModals,
        announceAlerts,
        clickToRead,
        readFocus,
    ]);

    const value = useMemo<AccessibilityContextType>(
        () => ({
            fontSize,
            setFontSize,
            highContrast,
            toggleHighContrast: () => setHighContrast((prev) => !prev),
            colorMode,
            setColorMode,
            highlightLinks,
            toggleHighlightLinks: () => setHighlightLinks((prev) => !prev),
            dyslexiaFont,
            toggleDyslexiaFont: () => setDyslexiaFont((prev) => !prev),
            textSpacing,
            toggleTextSpacing: () => setTextSpacing((prev) => !prev),
            bigCursor,
            toggleBigCursor: () => setBigCursor((prev) => !prev),
            readingGuide,
            toggleReadingGuide: () => setReadingGuide((prev) => !prev),
            stopAnimations,
            toggleStopAnimations: () => setStopAnimations((prev) => !prev),
            voiceReader,
            toggleVoiceReader: () => setVoiceReader((prev) => !prev),
            autoReadModals,
            toggleAutoReadModals: () => setAutoReadModals((prev) => !prev),
            announceAlerts,
            toggleAnnounceAlerts: () => setAnnounceAlerts((prev) => !prev),
            clickToRead,
            toggleClickToRead: () => setClickToRead((prev) => !prev),
            readFocus,
            toggleReadFocus: () => setReadFocus((prev) => !prev),
            resetAccessibility: () => {
                setFontSize("normal");
                setHighContrast(false);
                setColorMode("normal");
                setHighlightLinks(false);
                setDyslexiaFont(false);
                setTextSpacing(false);
                setBigCursor(false);
                setReadingGuide(false);
                setStopAnimations(false);
                setVoiceReader(false);
                setAutoReadModals(true);
                setAnnounceAlerts(true);
                setClickToRead(true);
                setReadFocus(true);
                localStorage.removeItem("a11y_font");
                localStorage.removeItem("a11y_contrast");
                localStorage.removeItem("a11y_color_mode");
                localStorage.removeItem("a11y_grayscale");
                localStorage.removeItem("a11y_sepia");
                localStorage.removeItem("a11y_links");
                localStorage.removeItem("a11y_dyslexia");
                localStorage.removeItem("a11y_text_spacing");
                localStorage.removeItem("a11y_big_cursor");
                localStorage.removeItem("a11y_reading_guide");
                localStorage.removeItem("a11y_stop_animations");
                localStorage.removeItem("a11y_voice_reader");
                localStorage.removeItem("a11y_reader_modals");
                localStorage.removeItem("a11y_reader_alerts");
                localStorage.removeItem("a11y_reader_click");
                localStorage.removeItem("a11y_reader_focus");
            },
        }),
        [
            fontSize,
            highContrast,
            colorMode,
            highlightLinks,
            dyslexiaFont,
            textSpacing,
            bigCursor,
            readingGuide,
            stopAnimations,
            voiceReader,
            autoReadModals,
            announceAlerts,
            clickToRead,
            readFocus,
        ],
    );

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}
