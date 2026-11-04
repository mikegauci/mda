"use client";
import { MediaField } from "@/components/admin/media-picker";
import { parseTiles, type CourseTile } from "@/lib/page-fields";

const field =
  "mt-1 block w-full rounded border border-black/20 bg-white p-2 text-sm";

// Repeater for the homepage course tiles: title, link and image each, with
// add, remove and reorder. The value is the tiles as JSON.
export function CourseTilesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const tiles = parseTiles(value);
  const set = (next: CourseTile[]) => onChange(JSON.stringify(next));
  const patch = (i: number, change: Partial<CourseTile>) =>
    set(tiles.map((t, j) => (j === i ? { ...t, ...change } : t)));
  const move = (i: number, by: number) => {
    const next = [...tiles];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    set(next);
  };

  return (
    <div className="mt-2 space-y-3">
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="grid gap-3 rounded border border-black/15 p-3 sm:grid-cols-[180px_1fr]"
        >
          <MediaField
            label={`Course ${i + 1} image`}
            value={
              tile.image
                ? {
                    id: `tile-${i}`,
                    path: tile.image,
                    alt: "",
                    width: null,
                    height: null,
                  }
                : null
            }
            onChange={(image) => patch(i, { image: image?.path ?? "" })}
          />
          <div className="space-y-2">
            <label className="block text-sm">
              Title (a new line starts a new line on the tile)
              <textarea
                rows={2}
                className={field}
                value={tile.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Link
              <input
                className={field}
                value={tile.url}
                placeholder="/product/basic-polishing/"
                onChange={(e) => patch(i, { url: e.target.value })}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={i === 0}
                className="rounded border px-3 py-1 disabled:opacity-30"
                aria-label={`Move course ${i + 1} up`}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === tiles.length - 1}
                className="rounded border px-3 py-1 disabled:opacity-30"
                aria-label={`Move course ${i + 1} down`}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="text-coral ml-auto text-sm"
                onClick={() => set(tiles.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="rounded border border-black/20 px-3 py-2 text-sm font-semibold"
        onClick={() =>
          set([...tiles, { title: "", url: "/product/", image: "" }])
        }
      >
        Add course
      </button>
    </div>
  );
}
