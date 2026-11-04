// Editable text and images of the pages laid out in code. Defaults are the
// live site's content. In text fields line breaks are kept, *words* are
// highlighted and **words** are bold.
type Field = {
  label: string;
  value: string;
  kind?: "image" | "order" | "select" | "tiles";
};

// A homepage course tile: the title (line breaks kept), a site link and a
// media path. Stored as JSON in the "courses" field.
export type CourseTile = { title: string; url: string; image: string };

export function parseTiles(value: string): CourseTile[] {
  try {
    const list = JSON.parse(value);
    return Array.isArray(list)
      ? list.filter(
          (t): t is CourseTile =>
            t &&
            typeof t.title === "string" &&
            typeof t.url === "string" &&
            typeof t.image === "string",
        )
      : [];
  } catch {
    return [];
  }
}

// The homepage's course tiles, in the live grid order (three per row).
const COURSE_TILES = [
  [
    "Hand wash only book",
    "/product/hand-wash-only/",
    "wp/2026/03/car_book_handwashonly.webp",
  ],
  [
    "Interior Car Cleaning",
    "/product/interior-car-cleaning/",
    "wp/2023/05/interior-1.webp",
  ],
  ["tint", "/product/tint/", "wp/2023/12/window-tint.webp"],
  ["Basic\nPolishing", "/product/basic-polishing/", "wp/2023/05/polish-1.webp"],
  [
    "Classic Car Detailing",
    "/product/classic-car-detailing/",
    "wp/2023/05/classic-1.webp",
  ],
  [
    "Motorbike\nDetailing for\nOwners",
    "/product/motorbike-detailing-for-owners/",
    "wp/2023/05/moto-1.webp",
  ],
  [
    "ceramic coating",
    "/product/ceramic-coating-course/",
    "wp/2023/05/polish-1.webp",
  ],
  [
    "wet sanding\nand levelling\nfor pros",
    "/product/wet-sanding-and-levelling/",
    "wp/2023/05/classic-1.webp",
  ],
  [
    "machine polishing",
    "/product/machine-polishing/",
    "wp/2023/05/moto-1.webp",
  ],
];

export const PAGE_FIELDS: Record<string, Record<string, Field>> = {
  "": {
    heroVideo: {
      label: "Hero background video (media path of an MP4)",
      value: "wp/2023/05/hero-video-mda.mp4",
    },
    heroHeading: {
      label: "Hero heading",
      value: "time to detail\nyour own car",
    },
    heroButton: { label: "Hero button", value: "VIEW COURSES" },
    heroButtonUrl: { label: "Hero button URL", value: "#courses" },
    aboutImage: {
      label: "About image",
      value: "wp/2023/05/mda-logo-blk.svg",
      kind: "image",
    },
    aboutText: {
      label: "About text",
      value:
        "Founded In 2023, Malta Detailing Academy’s aim is to provide you with all the detailing courses automotive enthusiast would need to know. Each course is guaranteed to teach you all there is before touching your car and get up to speed to detail your own car with one-to-one practice with professional instructors.",
    },
    coursesHeading: { label: "Courses heading", value: "courses" },
    courses: {
      label: "Course tiles (three per row)",
      value: JSON.stringify(
        COURSE_TILES.map(([title, url, image]) => ({ title, url, image })),
      ),
      kind: "tiles",
    },
  },
};
