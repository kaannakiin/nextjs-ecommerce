"use client";

import { Table, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

const CategoryTable = ({
  categories,
}: {
  categories: {
    id: string;
    name: string;
    parentCategory: { name: string } | null;
    createdAt: Date;
  }[];
}) => {
  const { push } = useRouter();
  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover verticalSpacing={"lg"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Kategori Adı</Table.Th>
            <Table.Th>Ebeveyn Kategori</Table.Th>
            <Table.Th>Oluşturulma Tarihi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {categories &&
            categories.length > 0 &&
            categories.map((category) => (
              <Table.Tr
                className="cursor-pointer"
                key={category.id}
                onClick={() =>
                  push(`/admin/products/definitions/categories/${category.id}`)
                }
              >
                <Table.Td>
                  <Text fw={500} fz="sm">
                    {category.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">
                    {category.parentCategory
                      ? category.parentCategory.name
                      : "Yok"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm">
                    {new Date(category.createdAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default CategoryTable;
