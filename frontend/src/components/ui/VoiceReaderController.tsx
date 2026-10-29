import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { VolumeXIcon } from "@animateicons/react/lucide";
import { useAccessibility } from "../../contexts/accessibility";
import { useVoiceReader } from "../../contexts/VoiceReaderContext";
import {
  findReadableTarget,
  getBlockSignature,
  getReadableBlocks,
  getTopDialog,
} from "../../utils/readableContent";

const LIVE_REGION_SELECTOR =
  '[role="alert"], [role="status"], [aria-live], [data-sileo-toast], [data-sileo-viewport]';

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, summary, [contenteditable='true'], [role='button'], [role='link'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [data-voice-reader-ui]";

function getLiveRegion(node: Element) {
  if (node.matches(LIVE_REGION_SELECTOR)) return node as HTMLElement;
  const closest = node.closest(LIVE_REGION_SELECTOR);
  if (closest) return closest as HTMLElement;
  return node.querySelector<HTMLElement>(LIVE_REGION_SELECTOR);
}

function isAssertive(region: HTMLElement) {
  return Boolean(
    region.closest('[role="alert"], [aria-live="assertive"]') ||
      region.querySelector('[role="alert"], [aria-live="assertive"], [data-state="error"]'),
  );
}

export default function VoiceReaderController() {
  const { voiceReader, autoReadModals, announceAlerts, clickToRead, readFocus } = useAccessibility();
  const { isSpeaking, readElement, readFocusTarget, stop } = useVoiceReader();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [activeDialog, setActiveDialog] = useState<HTMLElement | null>(null);

  const voiceReaderRef = useRef(voiceReader);
  const autoReadModalsRef = useRef(autoReadModals);
  const announceAlertsRef = useRef(announceAlerts);
  const clickToReadRef = useRef(clickToRead);
  const readFocusRef = useRef(readFocus);
  const readElementRef = useRef(readElement);
  const readFocusTargetRef = useRef(readFocusTarget);
  const stopRef = useRef(stop);
  const isSpeakingRef = useRef(isSpeaking);
  const activeDialogRef = useRef<HTMLElement | null>(null);
  const lastSignatureRef = useRef("");
  const modalTimerRef = useRef(0);
  const dialogReadAtRef = useRef(0);

  useEffect(() => {
    voiceReaderRef.current = voiceReader;
    autoReadModalsRef.current = autoReadModals;
    announceAlertsRef.current = announceAlerts;
    clickToReadRef.current = clickToRead;
    readFocusRef.current = readFocus;
    readElementRef.current = readElement;
    readFocusTargetRef.current = readFocusTarget;
    stopRef.current = stop;
    isSpeakingRef.current = isSpeaking;
  }, [voiceReader, autoReadModals, announceAlerts, clickToRead, readFocus, readElement, readFocusTarget, stop, isSpeaking]);

  useEffect(() => {
    stop();
  }, [pathname, stop]);

  useEffect(() => {
    if (!voiceReader) stopRef.current();
  }, [voiceReader]);

  useEffect(() => {
    if (!voiceReader || !autoReadModals) return;

    const dialog = getTopDialog();
    if (!dialog) return;

    const timer = window.setTimeout(() => {
      if (getTopDialog() !== dialog) return;
      if (!voiceReaderRef.current || !autoReadModalsRef.current) return;
      dialogReadAtRef.current = Date.now();
      readElementRef.current(dialog);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [voiceReader, autoReadModals]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isSpeakingRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      stopRef.current();
    };

    const handleDialogCancel = (event: Event) => {
      if (!isSpeakingRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      stopRef.current();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("cancel", handleDialogCancel, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("cancel", handleDialogCancel, true);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let stopped = false;

    const clearModalTimer = () => {
      if (!modalTimerRef.current) return;
      window.clearTimeout(modalTimerRef.current);
      modalTimerRef.current = 0;
    };

    const scheduleModalRead = (dialog: HTMLElement) => {
      clearModalTimer();
      modalTimerRef.current = window.setTimeout(() => {
        modalTimerRef.current = 0;
        if (stopped) return;
        if (!voiceReaderRef.current || !autoReadModalsRef.current) return;
        if (getTopDialog() !== dialog) return;
        readElementRef.current(dialog);
      }, 350);
    };

    const evaluate = () => {
      const dialog = getTopDialog();
      const previous = activeDialogRef.current;

      if (dialog !== previous) {
        activeDialogRef.current = dialog;
        setActiveDialog(dialog);
        lastSignatureRef.current = "";
        clearModalTimer();

        if (!dialog) {
          if (previous) stopRef.current();
          return;
        }

        if (voiceReaderRef.current && autoReadModalsRef.current) {
          lastSignatureRef.current = getBlockSignature(dialog);
          // Marca el inicio para no anunciar el foco automático del modal.
          dialogReadAtRef.current = Date.now();
          scheduleModalRead(dialog);
        }
        return;
      }

      if (dialog && voiceReaderRef.current && autoReadModalsRef.current) {
        const signature = getBlockSignature(dialog);
        if (!lastSignatureRef.current && signature) {
          lastSignatureRef.current = signature;
          dialogReadAtRef.current = Date.now();
          scheduleModalRead(dialog);
        }
      }
    };

    const scheduleEvaluate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        evaluate();
      });
    };

    scheduleEvaluate();
    const observer = new MutationObserver(scheduleEvaluate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open", "hidden", "aria-hidden"],
    });

    return () => {
      stopped = true;
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      clearModalTimer();
    };
  }, []);

  useEffect(() => {
    const pendingTimers = new Map<HTMLElement, number>();
    const seenTexts = new Map<string, number>();

    const readRegion = (region: HTMLElement) => {
      const now = Date.now();
      for (const [text, timestamp] of seenTexts) {
        if (now - timestamp > 2500) seenTexts.delete(text);
      }

      const blocks = getReadableBlocks(region, { includeControls: false });
      const text = blocks.map((block) => block.text).join(" ").trim();
      if (!text || seenTexts.has(text)) return;
      if (!voiceReaderRef.current || !announceAlertsRef.current) return;
      if (isSpeakingRef.current && !isAssertive(region)) return;

      seenTexts.set(text, now);
      readElementRef.current(region);
    };

    const scheduleRegion = (region: HTMLElement) => {
      const existing = pendingTimers.get(region);
      if (existing) window.clearTimeout(existing);

      const timer = window.setTimeout(() => {
        pendingTimers.delete(region);
        if (!region.isConnected) return;
        readRegion(region);
      }, 180);

      pendingTimers.set(region, timer);
    };

    const handleNode = (node: Node) => {
      const parent = node.parentElement;
      if (!parent) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const region = getLiveRegion(parent);
        if (region) scheduleRegion(region);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as Element;
      const region = getLiveRegion(element);
      if (region) scheduleRegion(region);
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          if (record.target instanceof Element) {
            const region = getLiveRegion(record.target);
            if (region) scheduleRegion(region);
          }
          continue;
        }

        for (const node of Array.from(record.addedNodes)) {
          handleNode(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "data-ready"],
    });

    return () => {
      observer.disconnect();
      for (const timer of pendingTimers.values()) window.clearTimeout(timer);
      pendingTimers.clear();
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!voiceReaderRef.current || !clickToReadRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-voice-reader-ui], #accessibility-panel")) return;
      if (target.closest(INTERACTIVE_SELECTOR)) return;

      const dialog = getTopDialog();
      if (dialog && target === dialog) return;
      if (dialog && !target.closest('dialog, [role="dialog"]')) return;

      const readable = findReadableTarget(target);
      if (!readable) return;

      window.setTimeout(() => {
        if (!voiceReaderRef.current || !clickToReadRef.current) return;
        if (!readable.isConnected) return;
        if (!readable.getClientRects().length) return;
        readElementRef.current(readable);
      }, 80);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    let timer = 0;
    let keyboardNavigation = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") keyboardNavigation = true;
    };

    const handlePointerDown = () => {
      keyboardNavigation = false;
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!voiceReaderRef.current || !readFocusRef.current) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target === document.body || target === document.documentElement) return;

      const shouldSkip = () => {
        const dialog = activeDialogRef.current;
        if (!dialog) return false;
        if (target === dialog) return true;
        if (target.closest('dialog, [role="dialog"]') !== dialog) return true;
        // Evita cortar la lectura automática del modal por el foco inicial.
        return Date.now() - dialogReadAtRef.current < 1000;
      };

      if (shouldSkip()) return;

      let focusVisible = keyboardNavigation;
      try {
        focusVisible = target.matches(":focus-visible");
      } catch {
        // Navegadores sin :focus-visible usan la intención de teclado.
      }
      if (!focusVisible) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.activeElement !== target) return;
        if (!voiceReaderRef.current || !readFocusRef.current) return;
        if (shouldSkip()) return;
        readFocusTargetRef.current(target);
      }, 90);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, []);

  if (!isSpeaking) return null;

  const stopButton = (
    <button
      type="button"
      data-voice-reader-ui=""
      onClick={stop}
      aria-label={t("accessibility.stopReading", { defaultValue: "Detener lectura" })}
      className="fixed bottom-6 left-1/2 z-[100000] flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-orange-500 px-5 font-body text-body-sm font-semibold text-white shadow-lg transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      <VolumeXIcon size={18} aria-hidden="true" />
      {t("accessibility.stopReading", { defaultValue: "Detener lectura" })}
    </button>
  );

  if (activeDialog?.isConnected) {
    return createPortal(stopButton, activeDialog);
  }

  return stopButton;
}
