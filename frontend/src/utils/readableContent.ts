export interface ReadableBlock {
  element: HTMLElement;
  text: string;
}

export interface ReadableControlLabels {
  checked: string;
  unchecked: string;
  selected: string;
  notSelected: string;
  empty: string;
  password: string;
}

interface ReadableOptions {
  includeControls?: boolean;
  controlLabels?: ReadableControlLabels;
}

const IGNORED_SELECTOR = [
  "[data-voice-reader-ui]",
  "#accessibility-panel",
  "[aria-hidden='true']",
  "[hidden]",
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
  ".sr-only",
].join(",");

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "BUTTON",
  "CAPTION",
  "DD",
  "DETAILS",
  "DIALOG",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HGROUP",
  "LABEL",
  "LEGEND",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "SUMMARY",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);

const CONTROL_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

const DEFAULT_CONTROL_LABELS: ReadableControlLabels = {
  checked: "activado",
  unchecked: "desactivado",
  selected: "seleccionado",
  notSelected: "no seleccionado",
  empty: "vacío",
  password: "campo de contraseña",
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function hasReadableCharacters(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}

function isIgnored(element: Element) {
  return Boolean(element.closest(IGNORED_SELECTOR));
}

function isSelfRenderable(element: Element) {
  if (element instanceof HTMLDialogElement && !element.open) return false;

  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
    return false;
  }
  if (style.opacity !== "" && Number(style.opacity) === 0) return false;

  return true;
}

function isElementVisible(element: Element) {
  if (!element.isConnected || isIgnored(element)) return false;

  let ancestor = element.parentElement;
  while (ancestor) {
    if (!isSelfRenderable(ancestor)) return false;
    if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
      const summary = ancestor.querySelector(":scope > summary");
      if (!summary || !summary.contains(element)) return false;
    }
    if (ancestor === document.body || ancestor === document.documentElement) break;
    ancestor = ancestor.parentElement;
  }

  return isSelfRenderable(element);
}

function isBlockLevel(element: Element) {
  if (BLOCK_TAGS.has(element.tagName)) return true;

  const display = getComputedStyle(element).display;
  return (
    display === "block" ||
    display === "flex" ||
    display === "grid" ||
    display === "list-item" ||
    display === "table" ||
    display.startsWith("table-") ||
    display === "flow-root"
  );
}

function getTextByIds(ids: string) {
  return ids
    .split(/\s+/)
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => Boolean(element))
    .map((element) => normalizeText(element.innerText || element.textContent))
    .filter(Boolean)
    .join(" ");
}

export function getAccessibleName(element: Element | null | undefined) {
  if (!element) return "";

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = getTextByIds(labelledBy);
    if (text) return text;
  }

  const ariaLabel = normalizeText(element.getAttribute("aria-label"));
  if (ariaLabel) return ariaLabel;

  if (element instanceof HTMLImageElement) {
    return normalizeText(element.alt);
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const labels = Array.from(element.labels ?? [])
      .map((label) => normalizeText(label.innerText || label.textContent))
      .filter(Boolean);
    if (labels.length) return labels.join(" ");
  }

  return normalizeText(element.getAttribute("title"));
}

function describeControl(element: HTMLElement, labels: ReadableControlLabels) {
  if (element instanceof HTMLInputElement) {
    const type = element.type;
    if (type === "hidden") return "";
    if (type === "password") {
      const name = getAccessibleName(element) || element.placeholder;
      return normalizeText(`${name} ${labels.password}`);
    }

    const name = getAccessibleName(element) || normalizeText(element.placeholder);
    if (type === "checkbox") {
      return normalizeText(`${name} ${element.checked ? labels.checked : labels.unchecked}`);
    }
    if (type === "radio") {
      return normalizeText(`${name} ${element.checked ? labels.selected : labels.notSelected}`);
    }
    if (type === "file") {
      const file = element.files?.[0]?.name ?? "";
      return normalizeText(`${name} ${file || labels.empty}`);
    }

    const value = normalizeText(element.value);
    return normalizeText([name, value || labels.empty].filter(Boolean).join(": "));
  }

  if (element instanceof HTMLSelectElement) {
    const name = getAccessibleName(element);
    const selected = Array.from(element.selectedOptions)
      .map((option) => normalizeText(option.textContent))
      .filter(Boolean)
      .join(", ");
    return normalizeText([name, selected || labels.empty].filter(Boolean).join(": "));
  }

  if (element instanceof HTMLTextAreaElement) {
    const name = getAccessibleName(element);
    const value = normalizeText(element.value);
    return normalizeText([name, value || labels.empty].filter(Boolean).join(": "));
  }

  return "";
}

interface WalkState {
  blocks: ReadableBlock[];
  buffer: string;
  blockElement: HTMLElement | null;
  labels: ReadableControlLabels;
  includeControls: boolean;
}

function flush(state: WalkState) {
  const text = normalizeText(state.buffer);
  state.buffer = "";
  if (!text || !hasReadableCharacters(text)) return;

  const previous = state.blocks[state.blocks.length - 1];
  if (previous?.text === text) return;

  state.blocks.push({ element: state.blockElement ?? document.body, text });
}

function appendText(state: WalkState, text: string) {
  if (!text) return;
  if (state.buffer && !state.buffer.endsWith(" ")) state.buffer += " ";
  state.buffer += text;
}

function walk(element: Element, state: WalkState) {
  if (isIgnored(element) || !isSelfRenderable(element)) return;

  if (element instanceof HTMLDetailsElement && !element.open) {
    const summary = element.querySelector(":scope > summary");
    if (summary) walk(summary, state);
    return;
  }

  if (CONTROL_TAGS.has(element.tagName) && state.includeControls) {
    flush(state);
    const description = describeControl(element as HTMLElement, state.labels);
    if (description) {
      state.blocks.push({ element: element as HTMLElement, text: description });
    }
    return;
  }

  if (element instanceof HTMLImageElement) {
    const alt = normalizeText(element.alt);
    if (alt) appendText(state, alt);
    return;
  }

  const isInteractive = element.matches("button, a, [role='button'], [role='link']");
  if (isInteractive) {
    const visibleText = normalizeText((element as HTMLElement).innerText);
    if (!hasReadableCharacters(visibleText)) {
      const name = getAccessibleName(element) || normalizeText(element.textContent);
      if (name) {
        flush(state);
        state.blocks.push({ element: element as HTMLElement, text: name });
        return;
      }
    }
  }

  const block = isBlockLevel(element);
  const previousBlock = state.blockElement;
  if (block) {
    flush(state);
    state.blockElement = element as HTMLElement;
  }

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(state, node.textContent ?? "");
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    walk(node as Element, state);
  }

  if (block) {
    flush(state);
    state.blockElement = previousBlock;
  }
}

export function getReadableBlocks(root: HTMLElement, options: ReadableOptions = {}): ReadableBlock[] {
  if (!isElementVisible(root)) return [];

  const state: WalkState = {
    blocks: [],
    buffer: "",
    blockElement: root,
    labels: options.controlLabels ?? DEFAULT_CONTROL_LABELS,
    includeControls: options.includeControls ?? true,
  };

  walk(root, state);
  flush(state);

  return state.blocks;
}

export function getDialogBlocks(dialog: HTMLElement, options: ReadableOptions = {}): ReadableBlock[] {
  const blocks = getReadableBlocks(dialog, options);
  const name = getAccessibleName(dialog);
  if (!name) return blocks;

  const first = blocks[0]?.text ?? "";
  const alreadyIncluded = first === name || first.startsWith(name);
  if (alreadyIncluded) return blocks;

  return [{ element: dialog, text: name }, ...blocks];
}

export function getTopDialog(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"][aria-modal="true"]'),
  ).filter((element) => !element.closest("[data-voice-reader-ui]") && isElementVisible(element));

  return candidates[candidates.length - 1] ?? null;
}

export function getPageBlocks(options: ReadableOptions = {}): ReadableBlock[] {
  return getReadableBlocks(document.body, options);
}

export function getBlockSignature(root: HTMLElement) {
  return getReadableBlocks(root, { includeControls: false })
    .map((block) => block.text)
    .join(" ")
    .slice(0, 4000);
}

export interface ReadableFocusLabels extends ReadableControlLabels {
  roleLink: string;
  roleButton: string;
  roleCheckbox: string;
  roleRadio: string;
  roleSwitch: string;
  roleTab: string;
  roleMenuItem: string;
  roleOption: string;
  roleTextBox: string;
  roleSearchBox: string;
  roleComboBox: string;
  roleSlider: string;
  roleSummary: string;
  expanded: string;
  collapsed: string;
  pressed: string;
  notPressed: string;
  disabled: string;
  required: string;
}

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
  "color",
]);

function getExplicitRole(element: Element) {
  return normalizeText(element.getAttribute("role")).split(/\s+/)[0] ?? "";
}

function getRoleLabel(element: HTMLElement, labels: ReadableFocusLabels) {
  const explicit = getExplicitRole(element);
  const explicitLabels: Record<string, string> = {
    link: labels.roleLink,
    button: labels.roleButton,
    checkbox: labels.roleCheckbox,
    radio: labels.roleRadio,
    switch: labels.roleSwitch,
    tab: labels.roleTab,
    menuitem: labels.roleMenuItem,
    menuitemcheckbox: labels.roleCheckbox,
    menuitemradio: labels.roleRadio,
    option: labels.roleOption,
    textbox: labels.roleTextBox,
    searchbox: labels.roleSearchBox,
    combobox: labels.roleComboBox,
    slider: labels.roleSlider,
  };
  if (explicit && explicitLabels[explicit]) return explicitLabels[explicit];

  if (element.tagName === "SUMMARY") return labels.roleSummary;
  if (element instanceof HTMLAnchorElement) return labels.roleLink;
  if (element instanceof HTMLButtonElement) return labels.roleButton;
  if (element instanceof HTMLSelectElement) return labels.roleComboBox;
  if (element instanceof HTMLTextAreaElement) return labels.roleTextBox;
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") return labels.roleCheckbox;
    if (element.type === "radio") return labels.roleRadio;
    if (element.type === "search") return labels.roleSearchBox;
    if (element.type === "range") return labels.roleSlider;
    if (["submit", "button", "reset", "image"].includes(element.type)) return labels.roleButton;
    if (element.type === "password") return labels.password;
    if (element.type === "hidden") return "";
    return labels.roleTextBox;
  }
  if (element.isContentEditable) return labels.roleTextBox;

  return "";
}

function getFocusStates(element: HTMLElement, labels: ReadableFocusLabels) {
  const states: string[] = [];
  const explicitRole = getExplicitRole(element);
  const nativeInput = element instanceof HTMLInputElement ? element : null;

  const ariaChecked = element.getAttribute("aria-checked");
  if (ariaChecked === "true" || ariaChecked === "mixed") {
    states.push(explicitRole === "radio" ? labels.selected : labels.checked);
  } else if (ariaChecked === "false") {
    states.push(explicitRole === "radio" ? labels.notSelected : labels.unchecked);
  } else if (nativeInput && (nativeInput.type === "checkbox" || nativeInput.type === "radio")) {
    const isRadio = nativeInput.type === "radio";
    states.push(
      nativeInput.checked
        ? isRadio
          ? labels.selected
          : labels.checked
        : isRadio
          ? labels.notSelected
          : labels.unchecked,
    );
  }

  if (element.getAttribute("aria-selected") === "true") states.push(labels.selected);

  const ariaPressed = element.getAttribute("aria-pressed");
  if (ariaPressed === "true" || ariaPressed === "mixed") states.push(labels.pressed);
  else if (ariaPressed === "false") states.push(labels.notPressed);

  const ariaExpanded = element.getAttribute("aria-expanded");
  if (ariaExpanded === "true") states.push(labels.expanded);
  else if (ariaExpanded === "false") states.push(labels.collapsed);

  const nativeDisabled = "disabled" in element && Boolean((element as HTMLButtonElement).disabled);
  if (element.getAttribute("aria-disabled") === "true" || nativeDisabled) states.push(labels.disabled);

  const nativeRequired = "required" in element && Boolean((element as HTMLInputElement).required);
  if (element.getAttribute("aria-required") === "true" || nativeRequired) states.push(labels.required);

  return Array.from(new Set(states));
}

function isFocusTargetVisible(element: HTMLElement) {
  if (!element.isConnected) return false;

  let ancestor = element.parentElement;
  while (ancestor) {
    if (!isSelfRenderable(ancestor)) return false;
    if (ancestor === document.body || ancestor === document.documentElement) break;
    ancestor = ancestor.parentElement;
  }

  return isSelfRenderable(element);
}

export function getFocusAnnouncement(element: HTMLElement, labels: ReadableFocusLabels) {
  if (!isFocusTargetVisible(element)) return "";

  const role = getRoleLabel(element, labels);
  const name =
    getAccessibleName(element) ||
    normalizeText(element.innerText) ||
    normalizeText(element.textContent) ||
    normalizeText(element.getAttribute("placeholder"));

  const parts: string[] = [];
  if (name) parts.push(name);
  if (role) parts.push(role);
  parts.push(...getFocusStates(element, labels));

  if (element instanceof HTMLInputElement) {
    if (TEXT_INPUT_TYPES.has(element.type)) {
      const value = normalizeText(element.value);
      if (value) parts.push(value);
    }
  } else if (element instanceof HTMLTextAreaElement) {
    const value = normalizeText(element.value);
    if (value) parts.push(value);
  } else if (element instanceof HTMLSelectElement) {
    const selected = Array.from(element.selectedOptions)
      .map((option) => normalizeText(option.textContent))
      .filter(Boolean)
      .join(", ");
    if (selected) parts.push(selected);
  }

  return normalizeText(Array.from(new Set(parts.filter(Boolean))).join(", "));
}

export function findReadableTarget(target: Element): HTMLElement | null {
  const interactiveSelector =
    "a, button, input, select, textarea, label, summary, [contenteditable='true'], [role='button'], [role='link'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [data-voice-reader-ui]";

  if (target.closest(interactiveSelector)) return null;
  if (target.closest(IGNORED_SELECTOR)) return null;

  const textBlock = target.closest<HTMLElement>(
    "p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, figcaption, dt, dd, pre, summary",
  );
  if (textBlock && hasReadableCharacters(normalizeText(textBlock.innerText || textBlock.textContent))) {
    return textBlock;
  }

  let current: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
  for (let depth = 0; current && current !== document.body && depth < 4; depth += 1) {
    const text = normalizeText(current.innerText || current.textContent);
    if (hasReadableCharacters(text)) return current;
    current = current.parentElement;
  }

  return null;
}
