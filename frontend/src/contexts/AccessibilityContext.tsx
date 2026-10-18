import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type FontSize = "normal" | "large" | "xlarge";

interface AccessibilityContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    highContrast: boolean;
    toggleHighContrast: () => void;
    grayscale: boolean;
    toggleGrayscale: () => void;
    highlightLinks: boolean;
    toggleHighlightLinks: () => void;
    resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        return (localStorage.getItem("a11y_font") as FontSize) || "normal";
    });

    const [highContrast, setHighContrast] = useState<boolean>(() => {
        return localStorage.getItem("a11y_contrast") === "true";
    });

    const [grayscale, setGrayscale] = useState<boolean>(() => {
        return localStorage.getItem("a11y_grayscale") === "true";
    });

    const [highlightLinks, setHighlightLinks] = useState<boolean>(() => {
        return localStorage.getItem("a11y_links") === "true";
    });

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("text-normal", "text-large", "text-xlarge");
        root.classList.add(`text-${fontSize}`);
        localStorage.setItem("a11y_font", fontSize);

        if (highContrast) {
            root.classList.add("high-contrast");
            localStorage.setItem("a11y_contrast", "true");
        } else {
            root.classList.remove("high-contrast");
            localStorage.removeItem("a11y_contrast");
        }

        if (grayscale) {
            root.classList.add("grayscale-mode");
            localStorage.setItem("a11y_grayscale", "true");
        } else {
            root.classList.remove("grayscale-mode");
            localStorage.removeItem("a11y_grayscale");
        }

        if (highlightLinks) {
            root.classList.add("highlight-links-mode");
            localStorage.setItem("a11y_links", "true");
        } else {
            root.classList.remove("highlight-links-mode");
            localStorage.removeItem("a11y_links");
        }
    }, [fontSize, highContrast, grayscale, highlightLinks]);

    const setFontSize = (size: FontSize) => setFontSizeState(size);
    const toggleHighContrast = () => setHighContrast((prev) => !prev);
    const toggleGrayscale = () => setGrayscale((prev) => !prev);
    const toggleHighlightLinks = () => setHighlightLinks((prev) => !prev);

    const resetAccessibility = () => {
        setFontSize("normal");
        setHighContrast(false);
        setGrayscale(false);
        setHighlightLinks(false);
        localStorage.removeItem("a11y_font");
        localStorage.removeItem("a11y_contrast");
        localStorage.removeItem("a11y_grayscale");
        localStorage.removeItem("a11y_sepia");
        localStorage.removeItem("a11y_links");
    };

    return (
        <AccessibilityContext.Provider
            value={{
                fontSize,
                setFontSize,
                highContrast,
                toggleHighContrast,
                grayscale,
                toggleGrayscale,
                highlightLinks,
                toggleHighlightLinks,
                resetAccessibility,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility debe usarse dentro de un AccessibilityProvider");
    }
    return context;
}