"use client";

import {
  Badge,
  Button,
  Checkbox,
  Collapse,
  Group,
  Loader,
  Modal,
  MultiSelectProps,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchCategoriesAsTree } from "../_actions/fetch-categories";

interface CustomCategorySelectProps extends MultiSelectProps {}

type CategoryTreeNode = {
  id: string;
  name: string;
  parentCategoryId: string | null;
  children: CategoryTreeNode[];
  depth: number;
};

const CustomCategorySelect = ({ ...props }: CustomCategorySelectProps) => {
  const { data, isLoading, isPending } = useQuery({
    queryKey: ["categories"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const categories = await fetchCategoriesAsTree();
      return categories.data || [];
    },
  });

  const [opened, { open, close }] = useDisclosure();
  const [tempSelectedCategories, setTempSelectedCategories] = useState<
    string[]
  >([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (opened) {
      setTempSelectedCategories(props.value || []);
      if (data && data.length > 0) {
        const mainCategoryIds = data.map((cat) => cat.id);
        setExpandedCategories(new Set(mainCategoryIds));
      }
    }
  }, [opened, props.value, data]);

  const handleToggleCategory = (categoryId: string) => {
    setTempSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    props.onChange?.(tempSelectedCategories);
    close();
  };

  const handleCancel = () => {
    setTempSelectedCategories(props.value || []);
    close();
  };

  const getSelectedCategoriesWithDepth = (categoryIds: string[]) => {
    const findCategoryWithDepth = (
      categories: CategoryTreeNode[],
      id: string
    ): { name: string; depth: number } | null => {
      for (const category of categories) {
        if (category.id === id) {
          return { name: category.name, depth: category.depth };
        }
        const childResult = findCategoryWithDepth(category.children, id);
        if (childResult) {
          return childResult;
        }
      }
      return null;
    };

    return categoryIds
      .map((id) => findCategoryWithDepth(data || [], id))
      .filter(
        (category): category is { name: string; depth: number } =>
          category !== null
      )
      .sort((a, b) => a.depth - b.depth);
  };

  const renderCategoryTree = (
    categories: CategoryTreeNode[],
    level: number = 0
  ) => {
    return categories.map((category) => (
      <div key={category.id} style={{ marginLeft: level * 16 }}>
        <div className="border-none hover:bg-gray-50 p-3 mb-1 rounded">
          <Group gap="xs" wrap="nowrap">
            {category.children.length > 0 ? (
              <div
                onClick={() => handleToggleExpand(category.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              >
                {expandedCategories.has(category.id) ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
              </div>
            ) : (
              <div style={{ width: 24 }} />
            )}

            <Checkbox
              checked={tempSelectedCategories.includes(category.id)}
              onChange={() => handleToggleCategory(category.id)}
              variant="outline"
            />

            <Text
              fz="sm"
              fw={level === 0 ? 600 : 500}
              c={level === 0 ? "dark" : "dimmed"}
              onClick={() => handleToggleCategory(category.id)}
              className="flex-1 cursor-pointer"
            >
              {category.name}
            </Text>
          </Group>
        </div>

        {category.children.length > 0 && (
          <Collapse in={expandedCategories.has(category.id)}>
            <div className="ml-2 border-l border-gray-200 pl-2">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          </Collapse>
        )}
      </div>
    ));
  };

  const selectedCategories = getSelectedCategoriesWithDepth(props.value || []);

  return (
    <>
      <div className="flex flex-col gap-3 py-4">
        <Group
          justify={
            props.value && props.value.length > 0
              ? "space-between"
              : "flex-start"
          }
          align="center"
        >
          <Text fz="lg" fw={500}>
            Kategori
          </Text>
          {props.value && props.value.length > 0 && (
            <Button type="button" onClick={open} variant="light">
              Kategorileri Düzenle
            </Button>
          )}
        </Group>

        {props.value && props.value.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category, index) => (
              <Badge key={index} variant="outline" color={"primary"} size="lg">
                {category.name}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <Text fw={600} fz="md" c="dimmed">
              Henüz bir kategori seçilmedi
            </Text>
            <Button type="button" onClick={open} variant="light">
              Kategori Ekle
            </Button>
          </div>
        )}
      </div>

      <Modal.Root
        opened={opened}
        onClose={handleCancel}
        centered
        size="lg"
        transitionProps={{ transition: "scale" }}
      >
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header className="border-b border-gray-200 mb-4">
            <Modal.Title fz="lg" fw={700}>
              Kategori Seç
            </Modal.Title>
            <Modal.CloseButton variant="transparent" />
          </Modal.Header>
          <Modal.Body>
            {isLoading || isPending ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : data && data.length > 0 ? (
              <ScrollArea.Autosize mah={500}>
                <Stack gap="xs">{renderCategoryTree(data)}</Stack>
              </ScrollArea.Autosize>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Text c="dimmed">Henüz kategori bulunmuyor</Text>
                <Button variant="light" size="sm">
                  Kategori Ekle
                </Button>
              </div>
            )}

            <Group
              justify="space-between"
              mt="lg"
              pt="md"
              className="border-t border-gray-200"
            >
              <Text size="sm" c="dimmed" fw={500}>
                {tempSelectedCategories.length} kategori seçildi
              </Text>
              <Group>
                <Button variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
                <Button variant="filled" onClick={handleSave}>
                  Kaydet ({tempSelectedCategories.length})
                </Button>
              </Group>
            </Group>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};

export default CustomCategorySelect;
