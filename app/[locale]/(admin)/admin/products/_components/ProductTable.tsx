"use client";
import { Badge, Table, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcessedProduct } from "../page";
import TableImage from "../../../_components/TableImage";

interface ProductTableProps {
  products: ProcessedProduct[];
}

const ProductTable = ({ products }: ProductTableProps) => {
  const [imageClicked, setImageClicked] = useState<string | null>(null); // ⭐ State ekle

  const formatPrice = (min: number, max: number, currency: string) => {
    if (min === max) {
      return `${min} ${currency}`;
    }
    return `${min} - ${max} ${currency}`;
  };

  const { push } = useRouter();

  const handleRowClick = (productId: string) => {
    if (imageClicked === productId) {
      setImageClicked(null); // Reset et
      return;
    }
    push(`/admin/products/product/${productId}`);
  };

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table
        highlightOnHover
        highlightOnHoverColor="primary.0"
        verticalSpacing={"md"}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Resim</Table.Th>
            <Table.Th>Ürün Adı</Table.Th>
            <Table.Th>Marka</Table.Th>
            <Table.Th>Kategori</Table.Th>
            <Table.Th>Fiyat Aralığı</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {products.map((product) => (
            <Table.Tr
              key={product.id}
              className="cursor-pointer"
              onClick={() => handleRowClick(product.id)} // ⭐ Yeni handler
            >
              <Table.Td align="center" w={96} className="relative">
                <TableImage
                  url={product.image}
                  onImageClick={() => setImageClicked(product.id)} // ⭐ Callback
                />
              </Table.Td>
              <Table.Td>
                <Text fw={500}>{product.name}</Text>
                {product.variantCount > 0 && (
                  <Badge variant="light" color="blue">
                    {product.variantCount} varyant
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Text>{product.brandName || "Marka yok"}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{product.categoryName || "Kategori yok"}</Text>
              </Table.Td>
              <Table.Td>
                <Text fw={600}>
                  {formatPrice(
                    product.minPrice,
                    product.maxPrice,
                    product.currency
                  )}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default ProductTable;
