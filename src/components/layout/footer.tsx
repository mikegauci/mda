import Link from "next/link";
import { Container } from "@/components/layout/container";
import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/site-settings";

// Astra "below footer" row on black: copyright, then email | terms | phone,
// then the Facebook and Instagram icons. It is the menu's #contact target.
export async function Footer() {
  const settings = await getSiteSettings();
  const copyright =
    settings.footerText ||
    "Copyright © 2026 Malta Detailing Academy | All rights reserved.";
  const email = settings.contactEmail || "info@mda.mt";
  const phone = settings.phone || "9945 7048";
  return (
    <footer id="contact" className="bg-black py-5 text-xs text-white">
      <Container className="grid min-h-[120px] items-center gap-2.5 text-center md:grid-cols-[1fr_auto_auto] md:gap-0 md:px-[30px]">
        <p className="md:pr-10 md:text-left">{copyright}</p>
        <p className="md:text-right">
          <a href={`mailto:${email}`}>{email}</a> |{" "}
          <Link href="/terms-and-conditions/" target="_blank">
            terms &amp; conditions
          </Link>{" "}
          | {phone}
        </p>
        <div className="flex justify-center gap-2 md:pl-[100px]">
          <SocialLink
            href={settings.Facebook || FACEBOOK_URL}
            label="Facebook"
            path="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"
          />
          <SocialLink
            href={settings.Instagram || INSTAGRAM_URL}
            label="Instagram"
            path="M224 202.66A53.34 53.34 0 1 0 277.36 256 53.38 53.38 0 0 0 224 202.66Zm124.71-41a54 54 0 0 0-30.41-30.41c-21-8.29-71-6.43-94.3-6.43s-73.25-1.93-94.31 6.43a54 54 0 0 0-30.41 30.41c-8.28 21-6.43 71.05-6.43 94.33S91 329.26 99.32 350.33a54 54 0 0 0 30.41 30.41c21 8.29 71 6.43 94.31 6.43s73.24 1.93 94.3-6.43a54 54 0 0 0 30.41-30.41c8.35-21 6.43-71.05 6.43-94.33s1.92-73.26-6.43-94.33ZM224 338a82 82 0 1 1 82-82 81.9 81.9 0 0 1-82 82Zm85.38-148.3a19.14 19.14 0 1 1 19.13-19.14 19.1 19.1 0 0 1-19.09 19.18ZM400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h352a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48Zm-17.12 290c-1.29 25.63-7.14 48.34-25.85 67s-41.4 24.63-67 25.85c-26.41 1.49-105.59 1.49-132 0-25.63-1.29-48.26-7.15-67-25.85s-24.63-41.42-25.85-67c-1.49-26.42-1.49-105.61 0-132 1.29-25.63 7.07-48.34 25.85-67s41.47-24.56 67-25.78c26.41-1.49 105.59-1.49 132 0 25.63 1.29 48.33 7.15 67 25.85s24.63 41.42 25.85 67.05c1.49 26.32 1.49 105.44 0 131.88Z"
          />
        </div>
      </Container>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  path,
}: {
  href: string;
  label: string;
  path: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-70"
    >
      <svg
        viewBox="0 0 448 512"
        className="size-[25px] fill-current"
        aria-hidden
      >
        <path d={path} />
      </svg>
    </a>
  );
}
