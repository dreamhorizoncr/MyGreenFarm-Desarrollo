import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionGlobalConfig } from "motion/react";
import { notifyReducedMotionChange } from "../utils/reducedMotion";
import { AccessibilityContext, type AccessibilityContextType, type ColorMode, type FontSize } from "./accessibility";

const COLOR_MODES: ColorMode[] = ["normal", "monochrome", "low-saturation", "high-saturation"];

function readBoolean(key: string, fallback = false) {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "true";
}

function readColorMode(): ColorMode {
    const saved = localStorage.getItem("a11y_color_mode");
    if (saved && COLOR_MODES.includes(saved as ColorMode)) return saved as ColorMode;
    // Migración desde el antiguo interruptor de escala de grises.
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

        root.classList.toggle("high-contrast", highContrast);
        if (highContrast) localStorage.setItem("a11y_contrast", "true");
        else localStorage.removeItem("a11y_contrast");

        root.classList.remove("grayscale-mode", "color-monochrome", "color-low-saturation", "color-high-saturation");
        root.classList.remove("color-normal");
        if (colorMode !== "normal") root.classList.add(`color-${colorMode}`);
        if (colorMode === "normal") localStorage.removeItem("a11y_color_mode");
        else localStorage.setItem("a11y_color_mode", colorMode);
        // Clave antigua: ya no se usa, se limpia para no reactivar el modo anterior.
        localStorage.removeItem("a11y_grayscale");

        root.classList.toggle("highlight-links-mode", highlightLinks);
        if (highlightLinks) localStorage.setItem("a11y_links", "true");
        else localStorage.removeItem("a11y_links");

        root.classList.toggle("dyslexia-font", dyslexiaFont);
        if (dyslexiaFont) localStorage.setItem("a11y_dyslexia", "true");
        else localStorage.removeItem("a11y_dyslexia");

        root.classList.toggle("text-spacing-mode", textSpacing);
        if (textSpacing) localStorage.setItem("a11y_text_spacing", "true");
        else localStorage.removeItem("a11y_text_spacing");

        root.classList.toggle("big-cursor", bigCursor);
        if (bigCursor) localStorage.setItem("a11y_big_cursor", "true");
        else localStorage.removeItem("a11y_big_cursor");

        root.classList.toggle("reading-guide-mode", readingGuide);
        if (readingGuide) localStorage.setItem("a11y_reading_guide", "true");
        else localStorage.removeItem("a11y_reading_guide");

        root.classList.toggle("stop-animations-mode", stopAnimations);
        MotionGlobalConfig.skipAnimations = stopAnimations;
        notifyReducedMotionChange();
        if (stopAnimations) localStorage.setItem("a11y_stop_animations", "true");
        else localStorage.removeItem("a11y_stop_animations");

        root.classList.toggle("voice-reader-mode", voiceReader);
        if (voiceReader) localStorage.setItem("a11y_voice_reader", "true");
        else localStorage.removeItem("a11y_voice_reader");

        if (autoReadModals) localStorage.removeItem("a11y_reader_modals");
        else localStorage.setItem("a11y_reader_modals", "false");

        if (announceAlerts) localStorage.removeItem("a11y_reader_alerts");
        else localStorage.setItem("a11y_reader_alerts", "false");

        if (clickToRead) localStorage.removeItem("a11y_reader_click");
        else localStorage.setItem("a11y_reader_click", "false");

        if (readFocus) localStorage.removeItem("a11y_reader_focus");
        else localStorage.setItem("a11y_reader_focus", "false");
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
