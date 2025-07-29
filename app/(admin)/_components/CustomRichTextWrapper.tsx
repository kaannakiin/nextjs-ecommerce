import dynamic from "next/dynamic";
export const CustomRichTextWrapper = dynamic(
  () => import("./CustomRichTextEditor"),
  { ssr: false }
);
