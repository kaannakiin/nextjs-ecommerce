"use client";

import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { set } from "zod";
import { DeleteCategory } from "../[slug]/actions/CategoryAction";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import { notifications } from "@mantine/notifications";

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
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { push, refresh } = useRouter();
  return (
    <>
      <GlobalLoadingOverlay visible={loading} />
      <Table.ScrollContainer minWidth={800}>
        <Table highlightOnHover verticalSpacing={"lg"}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Kategori Adı</Table.Th>
              <Table.Th>Ebeveyn Kategori</Table.Th>
              <Table.Th>Oluşturulma Tarihi</Table.Th>
              <Table.Th w={40} />
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
                    push(
                      `/admin/products/definitions/categories/${category.id}`
                    )
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
                      {new Date(category.createdAt).toLocaleDateString(
                        "tr-TR",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )}
                    </Text>
                  </Table.Td>
                  <Table.Td
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Popover
                      opened={opened[category.id] || false}
                      width={300}
                      position="bottom"
                      withArrow
                      shadow="md"
                      onDismiss={() => {
                        setOpened((prev) => ({
                          ...prev,
                          [category.id]: false,
                        }));
                      }}
                    >
                      <Popover.Target>
                        <ActionIcon
                          variant="transparent"
                          onClick={() => {
                            setOpened(() => ({
                              [category.id]: true,
                            }));
                          }}
                        >
                          <IconTrash color="red" />
                        </ActionIcon>
                      </Popover.Target>{" "}
                      <Popover.Dropdown>
                        <Stack gap={"md"}>
                          <Text size="sm" fw={700}>
                            {category.name} kategorisini silmek istediğinize
                            emin misiniz ?
                          </Text>
                          <Group justify="flex-end">
                            <Button
                              variant="default"
                              onClick={() => {
                                setOpened((prev) => ({
                                  ...prev,
                                  [category.id]: false,
                                }));
                              }}
                            >
                              Vazgeç
                            </Button>
                            <Button
                              onClick={async () => {
                                setLoading(true);
                                await DeleteCategory(category.id).then(
                                  (res) => {
                                    setLoading(false);
                                    if (res.success) {
                                      refresh();
                                    }
                                    setOpened((prev) => ({
                                      ...prev,
                                      [category.id]: false,
                                    }));
                                    notifications.show({
                                      message: res.message,
                                      color: res.success ? "primary" : "red",
                                      title: res.success ? "Başarılı" : "Hata",
                                      autoClose: 3000,
                                      position: "bottom-right",
                                      withCloseButton: false,
                                    });
                                  }
                                );
                              }}
                              variant="outline"
                              color={"red"}
                            >
                              Sil
                            </Button>
                          </Group>
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
};

export default CategoryTable;
