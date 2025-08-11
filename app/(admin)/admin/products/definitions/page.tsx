import AdminHoverCard from "@/app/(admin)/_components/AdminHoverCard";
import {
  IconBrandMedium,
  IconCategory,
  IconVersions,
} from "@tabler/icons-react";

const DefinitionsPage = () => {
  const data: {
    title: string;
    href: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      title: "Kategoriler",
      href: "/admin/products/definitions/categories",
      description:
        "Ürün Kategorilerinizi yönetebilir. Kategoriler oluşturabilir, düzenleyebilir ve silebilirsiniz.",
      icon: (
        <IconCategory
          size={32}
          className="group-hover:text-white text-black transition-colors duration-200"
        />
      ),
    },
    {
      title: "Markalar",
      href: "/admin/products/definitions/brands",
      description:
        "Ürün Markalarınızı yönetebilir. Markalar oluşturabilir, düzenleyebilir ve silebilirsiniz.",
      icon: (
        <IconBrandMedium
          size={32}
          className="group-hover:text-white text-black transition-colors duration-200"
        />
      ),
    },
    {
      title: "Varyant Grupları",
      href: "/admin/products/definitions/variants",
      description:
        "Ürün varyant gruplarınızı yönetebilir. Varyant grupları oluşturabilir, düzenleyebilir ve silebilirsiniz.",
      icon: (
        <IconVersions
          size={32}
          className="group-hover:text-white text-black transition-colors duration-200"
        />
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <AdminHoverCard data={data} />
    </div>
  );
};

export default DefinitionsPage;
