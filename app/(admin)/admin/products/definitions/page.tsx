import { Card, Group, SimpleGrid, Text } from "@mantine/core";
import {
  IconBrandMedium,
  IconCategory,
  IconVersions,
} from "@tabler/icons-react";
import Link from "next/link";

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
      href: "/admin/products/definitions/variant-groups",
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
      <SimpleGrid
        cols={{
          xs: 2,
          md: 3,
          lg: 4,
        }}
      >
        {data.map((item, index) => (
          <Card
            component={Link}
            href={item.href}
            key={`${item.href}-${index}`}
            withBorder
            radius={"md"}
            shadow="md"
            p="md"
            py={"lg"}
            className="hover:bg-gray-500 transition-colors duration-200 group"
          >
            <Group wrap="nowrap" gap="sm" align="flex-start">
              <div>{item.icon}</div>
              <div>
                <Text
                  fz="md"
                  fw={700}
                  className="group-hover:text-white text-black transition-colors duration-200"
                >
                  {item.title}
                </Text>
                <Text
                  fz="sm"
                  fw={500}
                  className="group-hover:text-white text-gray-600 transition-colors duration-200"
                >
                  {item.description}
                </Text>
              </div>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
};

export default DefinitionsPage;
