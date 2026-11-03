import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ManagedPageContent } from "@/components/managed-page-content";
import { RichLine } from "@/components/rich-line";
import { mediaUrl } from "@/lib/media";
import { COURSE_TILE_COUNT } from "@/lib/page-fields";
import { codePageMetadata } from "@/lib/seo";
import { getPageFields } from "@/lib/static-pages";

export function generateMetadata() {
  return codePageMetadata("", "Welcome to Malta Detailing Academy", {
    description:
      "Founded in 2023, Malta Detailing Academy offers detailing courses with one-to-one practice with professional instructors.",
  });
}

// The live homepage: a video hero, the #about row and the #courses grid of
// image tiles (the menu's anchors).
export default async function Home() {
  const f = await getPageFields("");
  const tiles = Array.from({ length: COURSE_TILE_COUNT }, (_, i) => ({
    title: f[`course${i + 1}Title`],
    url: f[`course${i + 1}Url`],
    image: f[`course${i + 1}Image`],
  })).filter((tile) => tile.title && tile.image);
  const rows = Array.from({ length: Math.ceil(tiles.length / 3) }, (_, i) =>
    tiles.slice(i * 3, i * 3 + 3),
  );

  return (
    <ManagedPageContent path="">
      <section className="relative overflow-hidden bg-black py-[100px] min-[977px]:py-[200px] md:py-[150px]">
        {f.heroVideo && (
          <video
            className="absolute inset-0 size-full object-cover"
            src={mediaUrl(f.heroVideo)}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-black/5" />
        <Container className="relative flex justify-end max-[976px]:justify-center">
          <div className="w-full max-[976px]:text-center min-[977px]:w-[30%]">
            <h1 className="section-title pb-2.5 text-white min-[977px]:pb-0">
              <RichLine text={f.heroHeading} />
            </h1>
            {f.heroButton && (
              <Link href={f.heroButtonUrl} className="bf-button mt-6">
                {f.heroButton}
                <svg
                  viewBox="0 0 448 512"
                  className="size-4 fill-current"
                  aria-hidden
                >
                  <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 0 273.7 0 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z" />
                </svg>
              </Link>
            )}
          </div>
        </Container>
      </section>

      <Container
        id="about"
        className="flex scroll-mt-4 flex-col items-start gap-6 pt-[81px] pb-28 md:flex-row"
      >
        {f.aboutImage && (
          <div className="w-full max-md:flex max-md:justify-center md:w-[20%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo from the media library */}
            <img
              src={mediaUrl(f.aboutImage)}
              alt=""
              width={200}
              height={200}
              className="h-[200px] w-auto max-w-full"
            />
          </div>
        )}
        <p className="flex-1 text-[22px] leading-[1.8] font-medium text-black">
          <RichLine text={f.aboutText} />
        </p>
      </Container>

      <Container id="courses" className="scroll-mt-4 pb-6">
        <h2 className="section-title pb-8 text-black">{f.coursesHeading}</h2>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid gap-6 md:grid-cols-3 ${i > 0 ? "py-6" : ""}`}
          >
            {row.map((tile) => (
              <Link
                key={`${tile.url}-${tile.image}`}
                href={tile.url}
                className="group relative block aspect-square overflow-hidden"
              >
                <Image
                  src={mediaUrl(tile.image)}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[350ms] ease-in-out group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-black/10" />
                <span className="section-title absolute inset-0 grid place-items-center px-2 text-center leading-8 text-white">
                  <span>
                    <RichLine text={tile.title} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ))}
      </Container>
    </ManagedPageContent>
  );
}
