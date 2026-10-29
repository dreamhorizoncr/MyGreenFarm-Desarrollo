import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadableBlock } from "../utils/readableContent";

const MAX_CHUNK_LENGTH = 180;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function splitIntoChunks(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= MAX_CHUNK_LENGTH) return [normalized];

  const sentences = normalized.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  for (const sentence of sentences) {
    if ((current + sentence).length <= MAX_CHUNK_LENGTH) {
      current += sentence;
      continue;
    }

    pushCurrent();

    if (sentence.length <= MAX_CHUNK_LENGTH) {
      current = sentence;
      continue;
    }

    let part = "";
    for (const word of sentence.split(/\s+/)) {
      if (!word) continue;
      const next = part ? `${part} ${word}` : word;
      if (next.length > MAX_CHUNK_LENGTH) {
        if (part) chunks.push(part);
        part = word;
      } else {
        part = next;
      }
    }
    current = part;
  }

  pushCurrent();
  return chunks;
}

function getSpeechLanguage(language: string) {
  const base = (language || "es").slice(0, 2).toLowerCase();
  if (base === "es") return "es-ES";
  if (base === "en") return "en-US";
  if (base === "fr") return "fr-FR";
  return base;
}

export function useSpeechReader(language: string) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const generationRef = useRef(0);
  const highlightedRef = useRef<HTMLElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const mountedRef = useRef(true);
  const speechLanguage = getSpeechLanguage(language);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      voicesRef.current = available;
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [supported]);

  const clearHighlight = useCallback(() => {
    highlightedRef.current?.classList.remove("a11y-reading-highlight");
    highlightedRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      if (supported) window.speechSynthesis.cancel();
      clearHighlight();
    };
  }, [supported, clearHighlight]);

  const highlight = useCallback((element: HTMLElement | null) => {
    if (!element || element === document.body || element === document.documentElement) return;
    if (element instanceof HTMLDialogElement || element.getAttribute("role") === "dialog") return;
    if (highlightedRef.current === element) return;

    highlightedRef.current?.classList.remove("a11y-reading-highlight");
    highlightedRef.current = element;
    element.classList.add("a11y-reading-highlight");

    const rect = element.getBoundingClientRect();
    const outsideViewport = rect.top < 72 || rect.bottom > window.innerHeight - 72;
    if (outsideViewport) {
      const reduceMotion =
        document.documentElement.classList.contains("stop-animations-mode") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    if (supported) window.speechSynthesis.cancel();
    clearHighlight();
    if (mountedRef.current) setIsSpeaking(false);
  }, [supported, clearHighlight]);

  const getVoice = useCallback(() => {
    const list = voicesRef.current.length ? voicesRef.current : supported ? window.speechSynthesis.getVoices() : [];
    const base = speechLanguage.slice(0, 2).toLowerCase();
    const matching = list.filter((voice) => voice.lang.toLowerCase().startsWith(base));
    return matching.find((voice) => voice.localService) ?? matching[0] ?? list.find((voice) => voice.default) ?? list[0] ?? null;
  }, [speechLanguage, supported]);

  const speakChunk = useCallback(
    (text: string, generation: number) =>
      new Promise<void>((resolve) => {
        if (!supported || generation !== generationRef.current) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLanguage;
        const voice = getVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        let settled = false;
        let watchdog = 0;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          resolve();
        };

        utterance.onend = finish;
        utterance.onerror = (event) => {
          if (event.error !== "canceled" && event.error !== "interrupted") {
            console.warn("Voice reader:", event.error);
          }
          finish();
        };

        watchdog = window.setTimeout(finish, Math.max(6000, text.length * 130));
        window.speechSynthesis.speak(utterance);
      }),
    [getVoice, speechLanguage, supported],
  );

  const speakBlocks = useCallback(
    async (blocks: ReadableBlock[]) => {
      if (!supported) return;
      if (!blocks.length) {
        stop();
        return;
      }

      const generation = ++generationRef.current;
      window.speechSynthesis.cancel();
      clearHighlight();
      if (mountedRef.current) setIsSpeaking(true);

      await delay(60);
      if (generation !== generationRef.current) return;

      for (const block of blocks) {
        if (generation !== generationRef.current) return;
        highlight(block.element);

        for (const chunk of splitIntoChunks(block.text)) {
          if (generation !== generationRef.current) return;
          await speakChunk(chunk, generation);
          if (generation !== generationRef.current) return;
        }
      }

      if (generation === generationRef.current) {
        clearHighlight();
        if (mountedRef.current) setIsSpeaking(false);
      }
    },
    [supported, stop, clearHighlight, highlight, speakChunk],
  );

  const speakText = useCallback(
    (text: string) => {
      const value = text.replace(/\s+/g, " ").trim();
      if (!value) return;
      void speakBlocks([{ element: document.body, text: value }]);
    },
    [speakBlocks],
  );

  return {
    supported,
    isSpeaking,
    voices,
    speakBlocks,
    speakText,
    stop,
  };
}
