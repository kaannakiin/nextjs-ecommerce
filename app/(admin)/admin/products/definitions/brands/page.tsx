import PageHeaderSearchInput from "@/app/(admin)/_components/PageHeaderSearchInput";
import { Button, Group, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

const ProductBrandPage = async () => {
  const searchKey = "brand";
  return (
    <div className="flex flex-col gap-4">
      <Group justify="space-between">
        <Title order={4}>Markalar</Title>
        <Group gap="md">
          <Button
            component={Link}
            href="/admin/products/definitions/brands/create"
            leftSection={<IconPlus size={24} />}
            radius="lg"
            variant="outline"
          >
            Yeni Marka Ekle
          </Button>
          <PageHeaderSearchInput searchKey={searchKey} radius="lg" />
        </Group>
      </Group>
    </div>
  );
};

export default ProductBrandPage;
