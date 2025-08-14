import { IconCurrencyLira } from "@tabler/icons-react";
import AdminHoverCard, {
  AdminHoverCardData,
} from "../../../_components/AdminHoverCard";

const LocalizationPage = () => {
  const data: AdminHoverCardData[] = [
    {
      href: "/admin/settings/localization/currency",
      icon: <IconCurrencyLira size={32} />,
      title: "Para Birimi Ayarları",
      description:
        "Fiyat ayarları, para birimi ve tarih formatı gibi yerelleştirme ayarlarını yönetin.",
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <AdminHoverCard data={data} />
    </div>
  );
};

export default LocalizationPage;
