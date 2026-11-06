"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  isLinkAddress,
  linkHtml,
  type InternalLink,
} from "@/lib/internal-links";

const LinksContext = createContext<InternalLink[]>([]);
export const InternalLinksProvider = LinksContext.Provider;

export function HtmlLinkInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  return (
    <div>
      <input
        ref={input}
        aria-label={label}
        className="mt-1 w-full rounded border border-black/20 bg-white p-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="mt-2 text-sm underline"
        onClick={() =>
          setSelection({
            start: input.current?.selectionStart ?? value.length,
            end: input.current?.selectionEnd ?? value.length,
          })
        }
      >
        Insert link
      </button>
      {selection && (
        <LinkPicker
          showText
          initialText={value.slice(selection.start, selection.end)}
          onClose={() => setSelection(null)}
          onSelect={(href, text) => {
            onChange(
              value.slice(0, selection.start) +
                linkHtml(href, text) +
                value.slice(selection.end),
            );
            setSelection(null);
          }}
        />
      )}
    </div>
  );
}

export function LinkField({
  value,
  onChange,
  label = "Link",
}: {
  value: string;
  onChange: (href: string) => void;
  label?: string;
}) {
  const links = useContext(LinksContext);
  const [open, setOpen] = useState(false);
  const selected = links.find(
    (link) =>
      link.href === value ||
      link.path === value ||
      (value.startsWith("#") && link.path === `/${value}`),
  );
  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-label={`${label}: ${selected?.label || value || "Choose a link"}`}
        onClick={() => setOpen(true)}
        className="block w-full rounded border border-black/20 bg-white p-2 text-left text-sm"
      >
        {selected?.label ||
          (value.startsWith("/internal-links/")
            ? "Unavailable page — choose another"
            : value) ||
          "Choose a link…"}
        {selected && (
          <span className="text-muted mt-0.5 block text-xs break-all">
            {selected.path}
          </span>
        )}
      </button>
      {open && (
        <LinkPicker
          value={value}
          onClose={() => setOpen(false)}
          onSelect={(href) => {
            onChange(href);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function LinkPicker({
  value = "",
  onClose,
  onSelect,
  showText = false,
  initialText = "",
}: {
  value?: string;
  onClose: () => void;
  onSelect: (href: string, text: string) => void;
  showText?: boolean;
  initialText?: string;
}) {
  const links = useContext(LinksContext);
  const [mode, setMode] = useState<"internal" | "external">(
    /^https?:|^mailto:|^tel:/i.test(value) ? "external" : "internal",
  );
  const [search, setSearch] = useState("");
  const [external, setExternal] = useState(mode === "external" ? value : "");
  const [text, setText] = useState(initialText);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    dialog.current?.showModal();
    dialog.current
      ?.querySelector<HTMLInputElement>(
        '[aria-label="Search internal pages"], input[placeholder="https://example.com"]',
      )
      ?.focus();
  }, []);
  const filtered = links.filter((link) =>
    `${link.label} ${link.path} ${link.group}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const select = (href: string, label: string) =>
    onSelect(href, text.trim() || label);
  const submitExternal = () => {
    const href = external.trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href) || !isLinkAddress(href)) {
      setError("Enter an http(s), email or telephone link.");
      return;
    }
    select(href, href);
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(event) => {
        if (
          event.key !== "Enter" ||
          !(event.target instanceof HTMLInputElement)
        )
          return;
        event.preventDefault();
        if (mode === "external") submitExternal();
        else if (
          event.target.getAttribute("aria-label") === "Search internal pages" &&
          filtered[0]
        )
          select(filtered[0].href, filtered[0].label);
      }}
      className="m-auto max-h-[85dvh] w-[min(640px,calc(100vw-32px))] overflow-y-auto rounded-lg bg-white p-5 text-black shadow-xl backdrop:bg-black/50"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-bold">
          Choose a link
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-3 py-1 text-sm"
        >
          Cancel
        </button>
      </div>
      {showText && (
        <label className="mb-4 block text-sm">
          Link text
          <input
            className="mt-1 w-full rounded border p-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Use the selected page’s name"
          />
        </label>
      )}
      <div className="mb-4 flex gap-2">
        {(["internal", "external"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={`rounded border px-3 py-2 text-sm ${mode === option ? "bg-black text-white" : "bg-white"}`}
          >
            {option === "internal" ? "Internal page" : "External link"}
          </button>
        ))}
      </div>
      {mode === "internal" ? (
        <>
          <input
            aria-label="Search internal pages"
            autoFocus
            className="mb-3 w-full rounded border p-2 text-sm"
            placeholder="Search pages, products, courses or sections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-[45dvh] overflow-y-auto">
            {(
              ["Pages", "Products & courses", "Homepage sections"] as const
            ).map((group) => {
              const items = filtered.filter((link) => link.group === group);
              return items.length ? (
                <div key={group} className="mb-3">
                  <h3 className="text-muted py-2 text-xs font-semibold">
                    {group}
                  </h3>
                  {items.map((link) => (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => select(link.href, link.label)}
                      className="block w-full rounded p-2 text-left text-sm hover:bg-black/5 focus-visible:outline-2"
                    >
                      <span className="font-semibold">{link.label}</span>
                      <span className="text-muted block text-xs break-all">
                        {link.path}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null;
            })}
            {!filtered.length && (
              <p role="status" className="py-6 text-sm">
                No matching pages. Only published content is available.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <label className="block text-sm">
            Link address
            <input
              type="text"
              className="mt-1 w-full rounded border p-2"
              placeholder="https://example.com"
              value={external}
              onChange={(e) => {
                setExternal(e.target.value);
                setError("");
              }}
            />
          </label>
          <p className="text-muted mt-1 text-xs">
            Website, email (mailto:) or telephone (tel:) links.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            className="mt-3 rounded bg-black px-4 py-2 text-sm text-white"
            onClick={submitExternal}
          >
            Use link
          </button>
        </>
      )}
      {value && (
        <button
          type="button"
          className="mt-4 text-sm underline"
          onClick={() => onSelect("", "")}
        >
          Remove link
        </button>
      )}
    </dialog>
  );
}
