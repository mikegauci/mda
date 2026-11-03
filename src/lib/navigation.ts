export type NavItem = { label: string; href: string; children?: NavItem[] };

// The live menu: the home page, its #about and #courses anchors (with the
// courses as a dropdown) and #contact, which scrolls to the footer.
export const primaryNav: NavItem[] = [
  { label: "Welcome to Malta Detailing Academy", href: "/" },
  { label: "About", href: "/#about" },
  {
    label: "Courses",
    href: "/#courses",
    children: [
      { label: "Exterior Car Washing", href: "/product/hand-wash-only/" },
      {
        label: "Interior Car Cleaning",
        href: "/product/interior-car-cleaning/",
      },
      { label: "Wheel Cleaning", href: "/product/wheel-cleaning/" },
      { label: "Basic Polishing", href: "/product/basic-polishing/" },
      {
        label: "Classic Car Detailing",
        href: "/product/classic-car-detailing/",
      },
      {
        label: "Motorbike Detailing for Owners",
        href: "/product/motorbike-detailing-for-owners/",
      },
      {
        label: "Motorbike Detailing for Pro",
        href: "/product/motorbike-detailing-for-pros/",
      },
      {
        label: "One to one day experience",
        href: "/product/one-to-one-day-experience/",
      },
      {
        label: "Ceramic Coating course",
        href: "/product/ceramic-coating-course/",
      },
    ],
  },
  { label: "Contact", href: "/#contact" },
];

export const FACEBOOK_URL = "https://www.facebook.com/maltadetailingacademy";
export const INSTAGRAM_URL = "https://www.instagram.com/maltadetailingacademy";

export function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  const normalise = (p: string) => p.replace(/\/+$/, "") || "/";
  const path = normalise(pathname);
  const target = normalise(href);
  return target === "/"
    ? path === "/"
    : path === target || path.startsWith(`${target}/`);
}

// The menu as edited in Settings: one "Label | /path/" per line; lines
// starting with "-" are dropdown items under the line above.
export function siteNavigation(lines?: string): NavItem[] {
  const items: NavItem[] = [];
  for (const raw of (lines || "").split("\n")) {
    const child = /^\s*-/.test(raw);
    const [label, href] = raw
      .replace(/^\s*-\s*/, "")
      .split("|")
      .map((s) => s.trim());
    if (!label || !/^\/(?!\/)[^\s]*$/.test(href ?? "")) continue;
    const parent = items.at(-1);
    if (child && parent) (parent.children ??= []).push({ label, href });
    else if (!child) items.push({ label, href });
  }
  return items.length ? items : primaryNav;
}
