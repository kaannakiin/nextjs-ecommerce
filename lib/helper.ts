import { AssetType } from "@/app/generated/prisma";

export function getAssetTypeLabel(type: AssetType) {
  switch (type) {
    case "IMAGE":
      return "Resim";
    case "VIDEO":
      return "Video";
    case "DOCUMENT":
      return "Belge";
    default:
      return "Resim";
  }
}
