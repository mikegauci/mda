"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/layout/container";
import { isActive, primaryNav, type NavItem } from "@/lib/navigation";

// Astra header: a 145px black bar, white logo left, lowercase thin menu right
// with the courses in a black dropdown. The URL is runtime data, so the
// prerendered shell shows the header without an active link and the
// highlighted version streams in.
export function Header({
  navigation = primaryNav,
}: {
  navigation?: NavItem[];
}) {
  return (
    <Suspense fallback={<HeaderView navigation={navigation} pathname={null} />}>
      <HeaderWithPath navigation={navigation} />
    </Suspense>
  );
}

function HeaderWithPath({ navigation }: { navigation: NavItem[] }) {
  return <HeaderView navigation={navigation} pathname={usePathname()} />;
}

function HeaderView({
  pathname,
  navigation,
}: {
  pathname: string | null;
  navigation: NavItem[];
}) {
  // Remember which page the menu was opened on so navigating closes it.
  // Without a pathname (the prerendered fallback) the menu is always closed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const open = pathname !== null && openOn === pathname;
  const close = () => setOpenOn(null);

  return (
    <header className="desk:h-[145px] relative z-40 bg-black text-white lowercase">
      <Container className="desk:h-[145px] flex h-[105px] items-center">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Malta Detailing Academy home"
        >
          <Image
            src="/brand/logo-light.svg"
            alt="Malta Detailing Academy"
            width={150}
            height={105}
            priority
            className="desk:w-[134px] h-auto w-[100px]"
          />
        </Link>

        <nav aria-label="Main" className="desk:flex ml-auto hidden">
          <ul className="flex items-center">
            {navigation.map((item) => {
              const active = pathname ? isActive(pathname, item.href) : false;
              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center gap-1.5 px-4 leading-[145px] font-light opacity-100 transition-opacity hover:opacity-70"
                  >
                    {item.label}
                    {item.children && <Chevron />}
                  </Link>
                  {item.children && (
                    <ul className="invisible absolute top-[calc(50%+20px)] left-0 w-[240px] border-2 border-black bg-black opacity-0 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.1)] transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-4 pt-[14.4px] pb-[0.9em] leading-[1.45] font-light hover:opacity-70"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="desk:hidden ml-auto px-1 text-white"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span className="sr-only">Main menu toggle</span>
          <MenuIcon open={open} />
        </button>
      </Container>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="desk:hidden absolute inset-x-0 top-full border-t border-white/20 bg-black"
        >
          <ul>
            {navigation.map((item) => (
              <li key={item.href} className="border-b border-white/20">
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={close}
                    className="block flex-1 px-5 leading-[50px] font-light"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      className="px-5 leading-[50px]"
                      aria-expanded={openSub === item.href}
                      aria-label={`${item.label} submenu`}
                      onClick={() =>
                        setOpenSub(openSub === item.href ? null : item.href)
                      }
                    >
                      <Chevron />
                    </button>
                  )}
                </div>
                {item.children && openSub === item.href && (
                  <ul className="pb-2">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={close}
                          className="block px-10 leading-10 font-light"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 448 512"
      className="size-3"
      aria-hidden
      fill="currentColor"
    >
      <path d="M207 381c9 9 25 9 34 0L433 189c9-9 9-25 0-34s-25-9-34 0L224 330 49 155c-9-9-25-9-34 0s-9 25 0 34l192 192z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-8" aria-hidden fill="currentColor">
      {open ? (
        <path d="M14.95 6.46 11.41 10l3.54 3.54-1.41 1.41L10 11.42l-3.53 3.53-1.42-1.42L8.58 10 5.05 6.47l1.42-1.42L10 8.58l3.54-3.53z" />
      ) : (
        <path d="M0 4h20v1.5H0zm0 5.25h20v1.5H0zm0 5.25h20V16H0z" />
      )}
    </svg>
  );
}
