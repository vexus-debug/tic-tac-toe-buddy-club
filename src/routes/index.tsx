import { createFileRoute } from "@tanstack/react-router";

// The imported app is mounted once in __root so navigation never remounts it.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clinexus | Healthcare software should understand healthcare" },
      {
        name: "description",
        content:
          "Clinexus builds specialized clinical management systems for dental, eye care, fertility, laboratory and general practice. Built around how your healthcare environment actually works.",
      },
      {
        property: "og:title",
        content: "Clinexus | Healthcare software should understand healthcare",
      },
      {
        property: "og:description",
        content:
          "Specialized clinical management systems for the different ways healthcare works. Your facility is not generic. Your software shouldn't be either.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://clinexus.com.ng/clinexus-social-preview.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://clinexus.com.ng/clinexus-social-preview.jpg" },
    ],
  }),
  component: () => null,
});
