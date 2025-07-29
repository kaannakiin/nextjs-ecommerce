"use client";

import PageHeaderSearchInput from "@/app/(admin)/_components/PageHeaderSearchInput";
import {
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBox, IconPlus, IconStack2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const ProductHeader = () => {
  const [opened, { open, close }] = useDisclosure();
  const { push } = useRouter();
  return (
    <>
      <Group justify="space-between" align="center">
        <Title order={4}>Ürünler</Title>
        <Group gap={"lg"}>
          <Button
            type="button"
            onClick={open}
            radius="lg"
            leftSection={<IconPlus size={16} />}
          >
            Ürün Ekle
          </Button>
          <PageHeaderSearchInput
            radius="lg"
            searchKey="search"
            variant="filled"
          />
        </Group>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        centered
        title="Ürün Ekle"
        size="md"
        classNames={{
          header: "border-b border-gray-200",
          title: "text-lg font-semibold",
        }}
      >
        <Stack gap="lg" m="xl">
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            onClick={() => {
              push("/admin/products/create-basic");
              close();
            }}
            withBorder
            style={{
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            className="hover:shadow-md hover:scale-[1.02]"
          >
            <Group gap="md" align="center">
              <Box
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBox size={24} color="white" />
              </Box>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text fw={600} size="lg">
                  Basit Ürün Ekle
                </Text>
                <Text size="sm" c="dimmed">
                  Tek varyantlı, standart ürün oluşturun
                </Text>
              </Stack>
            </Group>
          </Card>

          <Card
            shadow="sm"
            padding="lg"
            onClick={() => {
              push("/admin/products/create-variant");
              close();
            }}
            radius="md"
            withBorder
            style={{
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            className="hover:shadow-md hover:scale-[1.02]"
          >
            <Group gap="md" align="center">
              <Box
                style={{
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconStack2 size={24} color="white" />
              </Box>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text fw={600} size="lg">
                  Varyantlı Ürün Ekle
                </Text>
                <Text size="sm" c="dimmed">
                  Renk, beden gibi seçenekleri olan ürün oluşturun
                </Text>
              </Stack>
            </Group>
          </Card>
        </Stack>
      </Modal>
    </>
  );
};

export default ProductHeader;
