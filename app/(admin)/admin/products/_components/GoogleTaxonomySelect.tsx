"use client";
import { getTaxonomyData } from "@/actions/helper-actions/getTaxonomyData";
import { TaxonomyCategoryWithChildren } from "@/types/globalTypes";
import {
  ActionIcon,
  Box,
  Collapse,
  Combobox,
  Input,
  InputBase,
  InputWrapperProps,
  Loader,
  ScrollArea,
  Text,
  useCombobox,
} from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";

interface GoogleTaxonomySelectProps
  extends Omit<InputWrapperProps, "children" | "onChange"> {
  value?: string;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

const GoogleTaxonomySelect = ({
  value,
  onChange,
  placeholder = "Kategori seçin...",
  disabled = false,
  error,
  label,
  ...props
}: GoogleTaxonomySelectProps) => {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const { data, isLoading, isPending } = useQuery({
    queryKey: ["googleTaxonomyCategoriesNoRoot"],
    queryFn: async (): Promise<TaxonomyCategoryWithChildren[]> => {
      return await getTaxonomyData();
    },
  });

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch("");
    },
    onDropdownOpen: () => {
      combobox.resetSelectedOption();
    },
  });

  // Flatten categories to find selected
  const flattenCategories = (
    categories: TaxonomyCategoryWithChildren[]
  ): TaxonomyCategoryWithChildren[] => {
    const result: TaxonomyCategoryWithChildren[] = [];
    const traverse = (cats: TaxonomyCategoryWithChildren[]) => {
      for (const category of cats) {
        result.push(category);
        if (category.children && category.children.length > 0) {
          traverse(category.children);
        }
      }
    };
    traverse(categories);
    return result;
  };

  // Find selected category
  const selectedCategory = data
    ? flattenCategories(data).find((cat) => cat.id === value)
    : undefined;

  const toggleExpanded = useCallback(
    (categoryId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setExpandedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));
    },
    []
  );

  const filterCategories = (
    categories: TaxonomyCategoryWithChildren[]
  ): TaxonomyCategoryWithChildren[] => {
    if (!search.trim()) return categories;

    const searchTerm = search.toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          category.originalName.toLowerCase().includes(searchTerm) ||
          (category.pathNames?.toLowerCase().includes(searchTerm) ?? false);

        const hasMatchingChildren = category.children
          ? filterCategories(category.children).length > 0
          : false;

        return matchesSearch || hasMatchingChildren;
      })
      .map((category) => ({
        ...category,
        children: category.children ? filterCategories(category.children) : [],
      }));
  };

  const renderCategoryHierarchy = (
    categories: TaxonomyCategoryWithChildren[],
    depth = 0
  ): React.ReactNode[] => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories[category.id] || false;
      const paddingLeft = depth * 20;

      return (
        <React.Fragment key={category.id}>
          <Box
            style={{
              paddingLeft: paddingLeft,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {hasChildren ? (
              <>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={(e) => toggleExpanded(category.id, e)}
                >
                  {isExpanded ? (
                    <IconChevronDown size={12} />
                  ) : (
                    <IconChevronRight size={12} />
                  )}
                </ActionIcon>
                <Box
                  onClick={(e) => toggleExpanded(category.id, e)}
                  style={{
                    cursor: "pointer",
                    flex: 1,
                    padding: "8px 4px",
                  }}
                >
                  <Text size="sm" fw={500} c="dimmed">
                    {category.originalName}
                  </Text>
                </Box>
              </>
            ) : (
              // Leaf category - selectable
              <>
                <Box style={{ width: 20 }} />
                <Combobox.Option
                  value={category.id}
                  active={value === category.id}
                  style={{ flex: 1 }}
                >
                  <div>
                    <Text size="sm" fw={500}>
                      {category.originalName.split(" > ").pop()}
                    </Text>
                  </div>
                </Combobox.Option>
              </>
            )}
          </Box>

          {hasChildren && (
            <Collapse in={isExpanded}>
              <Box>
                {renderCategoryHierarchy(category.children!, depth + 1)}
              </Box>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const filteredCategories = data ? filterCategories(data) : [];

  return (
    <Input.Wrapper label={label} error={error} {...props}>
      <Combobox
        store={combobox}
        withinPortal={true}
        onOptionSubmit={(val) => {
          onChange?.(val);
          combobox.closeDropdown();
        }}
        disabled={disabled}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            pointer
            rightSection={
              selectedCategory ? (
                <Combobox.ClearButton onClear={() => onChange?.(null)} />
              ) : null
            }
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents="auto"
            disabled={disabled}
            error={error}
          >
            {selectedCategory ? (
              <div>
                <Text size="sm" fw={500}>
                  {selectedCategory.originalName}
                </Text>
              </div>
            ) : (
              <Input.Placeholder>{placeholder}</Input.Placeholder>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Kategori ara..."
          />
          <ScrollArea.Autosize type="scroll" mah={400}>
            <Combobox.Options>
              {isLoading || isPending ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px",
                  }}
                >
                  <Loader size="sm" />
                </div>
              ) : filteredCategories.length > 0 ? (
                renderCategoryHierarchy(filteredCategories)
              ) : (
                <Combobox.Option value="no-results" disabled>
                  Sonuç bulunamadı
                </Combobox.Option>
              )}
            </Combobox.Options>
          </ScrollArea.Autosize>
        </Combobox.Dropdown>
      </Combobox>
    </Input.Wrapper>
  );
};

export default GoogleTaxonomySelect;
