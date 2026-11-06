"use client";
import { LinkField } from "@/components/admin/link-picker";
import { useState } from "react";
import type { NavItem } from "@/lib/navigation";

const field = "w-full rounded border border-black/20 bg-white p-2 text-sm";
const small =
  "rounded border border-black/20 px-2.5 py-1 text-sm disabled:opacity-30";

// Serialises the menu back to the stored "Label | /path/" lines, with
// dropdown items on "-" lines under their parent (see siteNavigation()).
function toLines(items: NavItem[]) {
  const filled = (i: NavItem) => i.label.trim() && i.href.trim();
  return items
    .filter(filled)
    .flatMap((item) => [
      `${item.label.trim()} | ${item.href.trim()}`,
      ...(item.children ?? [])
        .filter(filled)
        .map((c) => `- ${c.label.trim()} | ${c.href.trim()}`),
    ])
    .join("\n");
}

function move<T>(list: T[], i: number, by: number) {
  const next = [...list];
  [next[i], next[i + by]] = [next[i + by], next[i]];
  return next;
}

// The site menu as rows: label, link (with suggestions of pages and
// courses), reorder, remove, and dropdown items under each top-level item.
// The form posts the lines in a hidden "navigation" field.
export function NavigationEditor({ initial }: { initial: NavItem[] }) {
  const [items, setItems] = useState<NavItem[]>(initial);
  const update = (i: number, patch: Partial<NavItem>) =>
    setItems(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const updateChild = (i: number, c: number, patch: Partial<NavItem>) =>
    update(i, {
      children: (items[i].children ?? []).map((child, j) =>
        j === c ? { ...child, ...patch } : child,
      ),
    });

  const row = (
    value: NavItem,
    onChange: (patch: Partial<NavItem>) => void,
    label: string,
  ) => (
    <div className="grid flex-1 gap-2 sm:grid-cols-2">
      <input
        className={field}
        aria-label={`${label} label`}
        placeholder="Label"
        value={value.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <LinkField
        label={`${label} link`}
        value={value.href}
        onChange={(href) => onChange({ href })}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="navigation" value={toLines(items)} />
      {items.map((item, i) => (
        <div key={i} className="rounded border border-black/15 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            {row(item, (patch) => update(i, patch), `Menu item ${i + 1}`)}
            <button
              type="button"
              className={small}
              disabled={i === 0}
              aria-label={`Move ${item.label || "item"} up`}
              onClick={() => setItems(move(items, i, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              className={small}
              disabled={i === items.length - 1}
              aria-label={`Move ${item.label || "item"} down`}
              onClick={() => setItems(move(items, i, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className="text-coral px-1 text-sm"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
          {(item.children ?? []).length > 0 && (
            <div className="mt-3 space-y-2 border-l-2 border-black/10 pl-4">
              <p className="text-muted text-xs">Dropdown items</p>
              {(item.children ?? []).map((child, c, children) => (
                <div key={c} className="flex flex-wrap items-center gap-2">
                  {row(
                    child,
                    (patch) => updateChild(i, c, patch),
                    `${item.label} dropdown item ${c + 1}`,
                  )}
                  <button
                    type="button"
                    className={small}
                    disabled={c === 0}
                    aria-label={`Move ${child.label || "item"} up`}
                    onClick={() =>
                      update(i, { children: move(children, c, -1) })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={small}
                    disabled={c === children.length - 1}
                    aria-label={`Move ${child.label || "item"} down`}
                    onClick={() =>
                      update(i, { children: move(children, c, 1) })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-coral px-1 text-sm"
                    onClick={() =>
                      update(i, {
                        children: children.filter((_, j) => j !== c),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() =>
              update(i, {
                children: [...(item.children ?? []), { label: "", href: "" }],
              })
            }
          >
            Add dropdown item
          </button>
        </div>
      ))}
      <button
        type="button"
        className="rounded border border-black/20 px-3 py-2 text-sm font-semibold"
        onClick={() => setItems([...items, { label: "", href: "" }])}
      >
        Add menu item
      </button>
      <p className="text-muted text-xs">
        Links are paths on this site: <code>/#about</code> for a homepage
        section, or a page such as <code>/product/basic-polishing/</code>. Start
        typing to pick a page or course. Empty rows are ignored.
      </p>
    </div>
  );
}
