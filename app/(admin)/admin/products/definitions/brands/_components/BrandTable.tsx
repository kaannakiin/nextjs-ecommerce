"use client";
import { Table } from "@mantine/core";
import { useRouter } from "next/navigation";
import React from "react";

const BrandTable = ({
  brands,
}: {
  brands: { id: string; name: string; parentName: string; createdAt: Date }[];
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  const { push } = useRouter();

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover verticalSpacing={"lg"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Marka Adı</Table.Th>
            <Table.Th>Ebeveyn Marka</Table.Th>
            <Table.Th>Oluşturulma Tarihi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {brands.length > 0 ? (
            brands.map((brand) => (
              <Table.Tr
                key={brand.id}
                className="cursor-pointer"
                onClick={() =>
                  push(`/admin/products/definitions/brands/${brand.id}`)
                }
              >
                <Table.Td>{brand.name}</Table.Td>
                <Table.Td>{brand.parentName}</Table.Td>
                <Table.Td>{formatDate(brand.createdAt)}</Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={3} style={{ textAlign: "center" }}>
                Hiç marka bulunamadı
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
export default BrandTable;
