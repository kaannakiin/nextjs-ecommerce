import AdminHoverCard, {
  AdminHoverCardData,
} from "@/app/(admin)/_components/AdminHoverCard";
import { IconCurrencyLira } from "@tabler/icons-react";

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
