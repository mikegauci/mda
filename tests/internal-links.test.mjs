import assert from "node:assert/strict";
import { test } from "node:test";
import {
  internalHref,
  resolveLinkValue,
  isLinkAddress,
  linkHtml,
} from "../src/lib/internal-links.ts";

const href = internalHref("product", "12345678-1234-1234-1234-123456789abc");
const target = {
  label: "Polishing",
  group: "Products & courses",
  href,
  path: "/product/polishing/",
};

test("saved references follow a renamed target across HTML, menu settings and tile JSON", () => {
  const stored = {
    html: `<a href="${href}?source=course#details">Course</a>`,
    navigation: `Course | ${href}\nExternal | https://example.com/`,
    tiles: JSON.stringify([
      { title: "Course", url: href, image: "photo.webp" },
    ]),
  };
  const renamed = { ...target, path: "/product/new-name/" };
  const first = resolveLinkValue(stored, [target]);
  const next = resolveLinkValue(stored, [renamed]);
  assert.equal(
    first.html,
    '<a href="/product/polishing/?source=course#details">Course</a>',
  );
  assert.equal(
    next.html,
    '<a href="/product/new-name/?source=course#details">Course</a>',
  );
  assert.equal(
    next.navigation,
    "Course | /product/new-name/\nExternal | https://example.com/",
  );
  assert.equal(JSON.parse(next.tiles)[0].url, "/product/new-name/");
  assert.ok(stored.html.includes(href), "stored references are not mutated");
});

test("unpublished or deleted targets retain references for the fallback 404", () => {
  assert.equal(resolveLinkValue(href, []), href);
});

test("legacy paths, anchors, external links and non-string values survive resolution", () => {
  const value = [
    "/product/legacy/",
    "/#courses",
    "https://example.com/",
    null,
    12,
  ];
  assert.deepEqual(resolveLinkValue(value, [target]), value);
});

test("link validation accepts supported destinations and rejects unsafe or malformed links", () => {
  for (const value of [
    "/",
    "/#courses",
    "#courses",
    href,
    "https://example.com/",
    "mailto:info@mda.mt",
    "tel:+35612345678",
  ])
    assert.equal(isLinkAddress(value), true, value);
  for (const value of [
    "",
    "//example.com",
    "javascript:alert(1)",
    "data:text/html,test",
    "/\\evil",
    "/two words/",
    'https://example.com/"onclick=x',
    "/x|Menu",
    "/x\ny",
  ])
    assert.equal(isLinkAddress(value), false, value);
});

test("HTML insertion escapes the address and display text", () => {
  assert.equal(
    linkHtml("https://example.com/?a=1&b=2", '<img src=x> & "Text"'),
    '<a href="https://example.com/?a=1&amp;b=2">&lt;img src=x&gt; &amp; &quot;Text&quot;</a>',
  );
});
