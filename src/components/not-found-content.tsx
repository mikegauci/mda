import Link from "next/link";
import { Container } from "@/components/layout/container";

// The 404 in the site's style: a black band like the homepage hero with the
// lowercase Black heading and the outline pills, then the way back.
export function NotFoundContent() {
  return (
    <section className="bg-black py-[100px] text-white md:py-[150px]">
      <Container className="text-center">
        <p className="text-[96px] leading-none font-bold md:text-[160px]">
          404
        </p>
        <h1 className="section-title mt-6">page not found</h1>
        <p className="mx-auto mt-4 max-w-[480px] text-lg">
          This page doesn’t seem to exist. It looks like the link pointing here
          was faulty.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/" className="bf-button">
            back to home
          </Link>
          <Link href="/#courses" className="bf-button">
            view courses
            <svg
              viewBox="0 0 448 512"
              className="size-4 fill-current"
              aria-hidden
            >
              <path d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 0 273.7 0 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z" />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
}
