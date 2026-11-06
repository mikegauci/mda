export type InternalLink = {
  label: string;
  group: "Pages" | "Products & courses" | "Homepage sections";
  href: string;
  path: string;
};

export function internalHref(type: "page" | "product", id: string) {
  return `/internal-links/${type}/${id}/`;
}

export function isLinkAddress(value: string) {
  return (
    /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)[^\s<>"|\\\x00-\x1f]+$/i.test(
      value,
    ) || value === "/"
  );
}

// Replace references in HTML, tile JSON and menu settings without changing
// their stored identities. Public output uses the current, canonical paths.
export function resolveLinkValue<T>(value: T, links: InternalLink[]): T {
  const paths = new Map(links.map((link) => [link.href, link.path]));
  function resolve(item: unknown): unknown {
    if (typeof item === "string")
      return item.replace(
        /\/internal-links\/(?:page|product)\/[\da-f-]{36}\//gi,
        (reference) => paths.get(reference) ?? reference,
      );
    if (Array.isArray(item)) return item.map(resolve);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item).map(([key, v]) => [key, resolve(v)]),
      );
    return item;
  }
  return resolve(value) as T;
}

export function linkHtml(href: string, text: string) {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]!,
    );
  return `<a href="${escape(href)}">${escape(text)}</a>`;
}
