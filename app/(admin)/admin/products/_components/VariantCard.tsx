"use client";

import {
  generateCombination,
  getVariantCombinationNames,
  updateVariantCombinations,
} from "@/lib/helper";
import { Variant, VariantProduct } from "@/schemas/product-schema";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ColorSwatch,
  Divider,
  Group,
  Loader,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDots,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconPointFilled,
  IconTrash,
} from "@tabler/icons-react";
import { Fragment, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import VariantForm from "../definitions/variants/_components/VariantForm";
import VariantCombinationDrawer from "./VariantCombinationDrawer";
import VariantMediaDrawer from "./VariantMediaDrawer";

interface VariantCardProps {
  control: Control<VariantProduct>;
  setValue: UseFormSetValue<VariantProduct>;
  watch: UseFormWatch<VariantProduct>;
}

const VariantCard = ({ control, setValue, watch }: VariantCardProps) => {
  const [variantCombinationIndex, setVariantCombinationIndex] = useState<
    number | null
  >(null);
  const [opened, { open, close, toggle }] = useDisclosure();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [
    openedVariantCombination,
    { open: openVariantCombination, close: closeVariantCombination },
  ] = useDisclosure();

  const [
    openedVariantMedia,
    { open: openVariantMedia, close: closeVariantMedia },
  ] = useDisclosure();

  const [selectedVariantCombination, setSelectedVariantCombination] = useState<
    number[]
  >([]);

  // Hydration kontrolü
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const openDrawerForNew = () => {
    setSelectedVariant(null);
    setIsEditing(false);
    setEditingIndex(null);
    open();
  };

  const openDrawerForEdit = (variant: Variant, index: number) => {
    setSelectedVariant(variant);
    setIsEditing(true);
    setEditingIndex(index);
    open();
  };

  const handleDrawerClose = () => {
    setSelectedVariant(null);
    setIsEditing(false);
    setEditingIndex(null);
    close();
  };
  const forceRerender = (newCombinations: VariantProduct["variants"]) => {
    replaceVariants([]);

    // Sonra yeni data ile doldur
    requestAnimationFrame(() => {
      replaceVariants(newCombinations);
    });
  };
  const {
    fields: selectedVariantsFields,
    remove: selectedVariantsRemove,
    update: selectedVariantsUpdate,
    append: selectedVariantsAppend,
    move: selectedVariantsMove,
  } = useFieldArray({
    control,
    name: "selectedVariants",
  });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variants",
  });

  const handleDragStart = () => {
    setIsDragging(true);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleDragEnd = (result: any) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (source.index === destination.index) {
      return;
    }

    try {
      selectedVariantsMove(source.index, destination.index);
      const reorderedVariants = [...selectedVariantsFields];
      const [movedItem] = reorderedVariants.splice(source.index, 1);
      reorderedVariants.splice(destination.index, 0, movedItem);
      const newCombinations = updateVariantCombinations(
        variantFields,
        selectedVariantsFields,
        { type: "REORDER", variants: reorderedVariants }
      );
      replaceVariants(newCombinations);
    } catch (error) {
      console.error("Varyant sıralama sırasında hata:", error);
    }
  };

  const toggleRow = (index: number) =>
    setSelectedVariantCombination((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );

  const toggleAll = () => {
    if (selectedVariantCombination.length === variantFields.length) {
      setSelectedVariantCombination([]);
    } else {
      setSelectedVariantCombination(variantFields.map((_, index) => index));
    }
  };

  const getStableId = (field: any, index: number) => {
    return field.uniqueId || `variant-${index}`;
  };

  // Hydration tamamlanana kadar render etme
  if (!isHydrated) {
    return <Loader />;
  }

  return (
    <>
      <Card withBorder radius={"sm"}>
        <Card.Section py={"lg"}>
          <Group justify="space-between" px={"lg"} align="start">
            <Stack gap={"xs"} className="w-full">
              <Group justify="space-between" align="center">
                <Title order={4}>Varyant</Title>
                {variantFields && variantFields.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={openDrawerForNew}
                    style={{
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    Varyant Ekle
                  </Button>
                )}
              </Group>
              {selectedVariantsFields && selectedVariantsFields.length > 0 && (
                <DragDropContext
                  onDragEnd={handleDragEnd}
                  onDragStart={handleDragStart}
                >
                  <Droppable
                    droppableId="variant-list"
                    direction="vertical"
                    renderClone={(provided, snapshot, rubric) => {
                      const field = selectedVariantsFields[rubric.source.index];
                      const translations = field.translations.find(
                        (translation) => translation.locale === "TR"
                      );

                      return ReactDOM.createPortal(
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            zIndex: 9999,
                          }}
                        >
                          <Group
                            grow
                            justify="space-between"
                            align="center"
                            p={"md"}
                            style={{
                              backgroundColor: "white",
                              boxShadow:
                                "0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)",
                              border: "2px solid #3b82f6",
                              borderRadius: "12px",
                              minWidth: "450px",
                              maxWidth: "650px",
                              transition:
                                "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            <Group
                              gap={"xs"}
                              align="center"
                              {...provided.dragHandleProps}
                            >
                              <ActionIcon
                                variant="filled"
                                color="blue"
                                size="sm"
                              >
                                <IconGripVertical size={16} />
                              </ActionIcon>
                              <Text fw={600} c="blue">
                                {translations?.name}
                              </Text>
                              <Text c={"blue.6"} fz="sm">
                                {rubric.source.index === 0 && "(Ana Grup)"}
                              </Text>
                            </Group>
                          </Group>
                        </div>,
                        document.body
                      );
                    }}
                  >
                    {(provided) => (
                      <Stack
                        gap={"xs"}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: isDragging ? 0.95 : 1,
                        }}
                      >
                        {selectedVariantsFields.map((field, index) => {
                          const translations = field.translations.find(
                            (translation) => translation.locale === "TR"
                          );

                          const stableId = getStableId(field, index);

                          return (
                            <Draggable
                              key={stableId}
                              draggableId={stableId}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0 : 1,
                                    transform: snapshot.isDragging
                                      ? "none"
                                      : provided.draggableProps.style
                                          ?.transform,
                                  }}
                                >
                                  <Group
                                    grow
                                    justify="space-between"
                                    align="center"
                                    p={"xs"}
                                    className="border border-gray-300 w-full"
                                    style={{
                                      borderRadius: "8px",
                                      backgroundColor: "white",
                                      transition:
                                        "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                      cursor: "default",
                                      borderColor: snapshot.draggingOver
                                        ? "#3b82f6"
                                        : "#d1d5db",
                                      boxShadow: snapshot.draggingOver
                                        ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                                        : "0 1px 3px rgba(0, 0, 0, 0.1)",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!snapshot.isDragging) {
                                        e.currentTarget.style.transform =
                                          "translateY(-2px)";
                                        e.currentTarget.style.boxShadow =
                                          "0 4px 12px rgba(0, 0, 0, 0.15)";
                                        e.currentTarget.style.borderColor =
                                          "#9ca3af";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!snapshot.isDragging) {
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                          "0 1px 3px rgba(0, 0, 0, 0.1)";
                                        e.currentTarget.style.borderColor =
                                          "#d1d5db";
                                      }
                                    }}
                                  >
                                    <Group gap={"xs"} align="center">
                                      <div
                                        {...provided.dragHandleProps}
                                        style={{
                                          cursor: "grab",
                                          padding: "8px",
                                          borderRadius: "6px",
                                          color: "#6b7280",
                                          transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "rgba(59, 130, 246, 0.1)";
                                          e.currentTarget.style.color =
                                            "#3b82f6";
                                          e.currentTarget.style.transform =
                                            "scale(1.1)";
                                          e.currentTarget.style.cursor = "grab";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                          e.currentTarget.style.color =
                                            "#6b7280";
                                          e.currentTarget.style.transform =
                                            "scale(1)";
                                        }}
                                        onMouseDown={(e) => {
                                          e.currentTarget.style.cursor =
                                            "grabbing";
                                          e.currentTarget.style.transform =
                                            "scale(0.95)";
                                        }}
                                        onMouseUp={(e) => {
                                          e.currentTarget.style.cursor = "grab";
                                          e.currentTarget.style.transform =
                                            "scale(1.1)";
                                        }}
                                      >
                                        <IconGripVertical size={20} />
                                      </div>
                                      <Text fw={500}>{translations?.name}</Text>
                                      <Text c={"dimmed"} fz="sm">
                                        {index === 0 && "(Ana Grup)"}
                                      </Text>
                                    </Group>

                                    <Group wrap="nowrap" justify="center">
                                      {field.options.map(
                                        (option, optionIndex) => {
                                          const optionTranslation =
                                            option.translations.find(
                                              (translation) =>
                                                translation.locale === "TR"
                                            );

                                          return (
                                            <Fragment
                                              key={`${stableId}-option-${optionIndex}`}
                                            >
                                              {field.type === "CHOICE" ? (
                                                <Text fz={"sm"}>
                                                  {optionTranslation?.name}
                                                </Text>
                                              ) : (
                                                <Group
                                                  gap={"xs"}
                                                  align="center"
                                                >
                                                  {option.image ? (
                                                    <Avatar
                                                      size={32}
                                                      src={URL.createObjectURL(
                                                        option.image
                                                      )}
                                                      style={{
                                                        transition:
                                                          "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                      }}
                                                    />
                                                  ) : option.existingImages ? (
                                                    <Avatar
                                                      size={32}
                                                      src={
                                                        option.existingImages
                                                          .url
                                                      }
                                                      style={{
                                                        transition:
                                                          "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                      }}
                                                    />
                                                  ) : (
                                                    <ColorSwatch
                                                      color={option.value}
                                                      radius={"xs"}
                                                      size={"18px"}
                                                      style={{
                                                        transition:
                                                          "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                      }}
                                                    />
                                                  )}
                                                  <Text fz={"sm"}>
                                                    {optionTranslation?.name}
                                                  </Text>
                                                </Group>
                                              )}

                                              {optionIndex <
                                                field.options.length - 1 && (
                                                <IconPointFilled
                                                  size={16}
                                                  style={{
                                                    color: "#666",
                                                    transition:
                                                      "color 0.2s ease",
                                                  }}
                                                />
                                              )}
                                            </Fragment>
                                          );
                                        }
                                      )}
                                    </Group>

                                    <Group gap={"md"} justify="flex-end">
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        onClick={() =>
                                          openDrawerForEdit(field, index)
                                        }
                                        style={{
                                          transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform =
                                            "scale(1.1)";
                                          e.currentTarget.style.backgroundColor =
                                            "rgba(59, 130, 246, 0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform =
                                            "scale(1)";
                                          e.currentTarget.style.backgroundColor =
                                            "transparent";
                                        }}
                                      >
                                        <IconEdit size={16} />
                                      </ActionIcon>
                                      <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => {
                                          try {
                                            const removedVariant =
                                              selectedVariantsFields[index];
                                            const newCombinations =
                                              updateVariantCombinations(
                                                variantFields,
                                                selectedVariantsFields,
                                                {
                                                  type: "REMOVE",
                                                  variantId:
                                                    removedVariant.uniqueId!,
                                                }
                                              );
                                            selectedVariantsRemove(index);
                                            replaceVariants(newCombinations);
                                          } catch (error) {
                                            console.error(
                                              "Varyant silme hatası:",
                                              error
                                            );
                                          }
                                        }}
                                        style={{
                                          transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform =
                                            "scale(1.1)";
                                          e.currentTarget.style.backgroundColor =
                                            "rgba(239, 68, 68, 0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform =
                                            "scale(1)";
                                          e.currentTarget.style.backgroundColor =
                                            "transparent";
                                        }}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Group>
                                  </Group>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Stack>
          </Group>
          <Divider my={"md"} />
        </Card.Section>
        {variantFields && variantFields.length > 0 ? (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing={"md"}>
              <Table.Thead bg={"gray.1"}>
                <Table.Tr>
                  <Table.Th w={40}>
                    <Checkbox
                      checked={
                        selectedVariantCombination.length ===
                        variantFields.length
                      }
                      onChange={toggleAll}
                      indeterminate={
                        selectedVariantCombination.length > 0 &&
                        selectedVariantCombination.length < variantFields.length
                      }
                    />
                  </Table.Th>
                  <Table.Th>Varyantlar</Table.Th>
                  <Table.Th>Satış Fiyatı</Table.Th>
                  <Table.Th>İndirimli Fiyat</Table.Th>
                  <Table.Th>Alış Fiyatı</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th>Barkod</Table.Th>
                  <Table.Th>Stok</Table.Th>
                  <Table.Th w={80} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {variantFields.map((field, index) => {
                  const optionNames = getVariantCombinationNames(
                    field.options,
                    selectedVariantsFields
                  );
                  const mainId = getStableId(field, index);
                  const variantData = watch(`variants.${index}`);
                  const existingImages = variantData?.existingImages || [];
                  const newImages = variantData?.images || [];

                  return (
                    <Table.Tr
                      className="cursor-pointer"
                      key={mainId}
                      onClick={(event) => {
                        const target = event.target as HTMLElement;
                        const isInteractiveElement = target.closest(
                          'input, button, [role="button"], [contenteditable]'
                        );

                        if (!isInteractiveElement) {
                          setVariantCombinationIndex(index);
                          openVariantCombination();
                        }
                      }}
                      p={"md"}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={selectedVariantCombination.includes(index)}
                          onChange={() => toggleRow(index)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group
                          gap={"xs"}
                          align="center"
                          justify="flex-start"
                          wrap="nowrap"
                        >
                          <ActionIcon size={"xl"} color={"gray.3"} radius={"0"}>
                            {(() => {
                              // Önce existing images kontrol et
                              if (existingImages.length > 0) {
                                return (
                                  <Avatar
                                    key={`${mainId}-existing`}
                                    src={existingImages[0].url}
                                    radius={"0"}
                                    size={"xl"}
                                    onClick={() => {
                                      openVariantMedia();
                                      setOpenedIndex(index);
                                    }}
                                  />
                                );
                              }

                              // Existing images yoksa new images kontrol et
                              if (newImages.length > 0) {
                                return (
                                  <Avatar
                                    key={`${mainId}-new`}
                                    src={URL.createObjectURL(newImages[0])}
                                    radius={"0"}
                                    size={"xl"}
                                    imageProps={{
                                      className: "object-contain",
                                    }}
                                    onClick={() => {
                                      openVariantMedia();
                                      setOpenedIndex(index);
                                    }}
                                  />
                                );
                              }

                              // Hiçbiri yoksa plus icon göster
                              return (
                                <IconPlus
                                  size={24}
                                  color="black"
                                  onClick={() => {
                                    openVariantMedia();
                                    setOpenedIndex(index);
                                  }}
                                />
                              );
                            })()}
                          </ActionIcon>
                          {optionNames.map((value, option) => (
                            <Badge
                              radius={"0"}
                              variant="outline"
                              size="md"
                              key={`${mainId}-badge-${option}`}
                            >
                              {value}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          key={`${mainId}-price`}
                          control={control}
                          name={`variants.${index}.prices.0.price`}
                          render={({ field, fieldState }) => (
                            <NumberInput
                              key={`${mainId}-price-input`}
                              {...field}
                              hideControls
                              error={fieldState.error?.message}
                              leftSection={"₺"}
                              min={0}
                              max={Number.MAX_SAFE_INTEGER}
                              allowNegative={false}
                              thousandSeparator=","
                              decimalScale={2}
                              onChange={(value) => {
                                field.onChange(Number(value) ?? 0);
                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                )
                                  return;
                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.prices.0.price`,
                                        Number(value) ?? 0
                                      );
                                    }
                                  }
                                );
                              }}
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          control={control}
                          key={`${mainId}-discounted`}
                          name={`variants.${index}.prices.0.discountedPrice`}
                          render={({ field, fieldState }) => (
                            <NumberInput
                              {...field}
                              key={`${mainId}-discounted-input`}
                              hideControls
                              error={fieldState.error?.message}
                              leftSection={"₺"}
                              min={0}
                              onChange={(value) => {
                                let finalValue = null;
                                if (
                                  value === null ||
                                  value === undefined ||
                                  value === "" ||
                                  Number(value) === 0
                                ) {
                                  finalValue = null;
                                } else {
                                  finalValue = Number(value);
                                }
                                field.onChange(finalValue);

                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                )
                                  return;

                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.prices.0.discountedPrice`,
                                        finalValue
                                      );
                                    }
                                  }
                                );
                              }}
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                              max={Number.MAX_SAFE_INTEGER}
                              allowNegative={false}
                              thousandSeparator=","
                              decimalScale={2}
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          control={control}
                          key={`${mainId}-buyed`}
                          name={`variants.${index}.prices.0.buyedPrice`}
                          render={({ field, fieldState }) => (
                            <NumberInput
                              {...field}
                              key={`${mainId}-buyed-input`}
                              error={fieldState.error?.message}
                              onChange={(value) => {
                                let finalValue = null;
                                if (
                                  value === null ||
                                  value === undefined ||
                                  value === "" ||
                                  Number(value) === 0
                                ) {
                                  finalValue = null;
                                } else {
                                  finalValue = Number(value);
                                }
                                field.onChange(finalValue);

                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                )
                                  return;

                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.prices.0.buyedPrice`,
                                        finalValue
                                      );
                                    }
                                  }
                                );
                              }}
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                              hideControls
                              leftSection={"₺"}
                              min={0}
                              max={Number.MAX_SAFE_INTEGER}
                              allowNegative={false}
                              thousandSeparator=","
                              decimalScale={2}
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          control={control}
                          name={`variants.${index}.sku`}
                          key={`${mainId}-sku`}
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              key={`${mainId}-sku-input`}
                              error={fieldState.error?.message}
                              onChange={(e) => {
                                field.onChange(e.currentTarget.value);

                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                ) {
                                  return;
                                }

                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.sku`,
                                        e.currentTarget.value
                                      );
                                    }
                                  }
                                );
                              }}
                              value={field.value ?? undefined}
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          control={control}
                          key={mainId}
                          name={`variants.${index}.barcode`}
                          render={({ field, fieldState }) => (
                            <TextInput
                              {...field}
                              key={mainId}
                              value={field.value ?? undefined}
                              error={fieldState.error?.message}
                              onChange={(e) => {
                                field.onChange(e.currentTarget.value);
                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                ) {
                                  return;
                                }
                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.barcode`,
                                        e.currentTarget.value
                                      );
                                    }
                                  }
                                );
                              }}
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Controller
                          control={control}
                          name={`variants.${index}.stock`}
                          key={mainId}
                          render={({ field, fieldState }) => (
                            <NumberInput
                              hideControls
                              {...field}
                              error={fieldState.error?.message}
                              min={0}
                              onChange={(value) => {
                                field.onChange(Number(value) ?? 0);
                                if (
                                  !selectedVariantCombination.some(
                                    (selectedIndex) => selectedIndex === index
                                  )
                                ) {
                                  return;
                                }
                                selectedVariantCombination.forEach(
                                  (selectedIndex) => {
                                    if (selectedIndex !== index) {
                                      setValue(
                                        `variants.${selectedIndex}.stock`,
                                        Number(value) ?? 0
                                      );
                                    }
                                  }
                                );
                              }}
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                              max={Number.MAX_SAFE_INTEGER}
                              allowNegative={false}
                              thousandSeparator=","
                              decimalScale={2}
                            />
                          )}
                        />
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="transparent"
                          onClick={() => {
                            setVariantCombinationIndex(index);
                            openVariantCombination();
                          }}
                        >
                          <IconDots />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Stack gap={"xs"} justify="center" align="center">
            <Text fw={700} fz={"md"}>
              Henüz bir varyant eklenmemiş.
            </Text>
            <Text fw={500} c="dimmed" fz={"sm"}>
              Renk, beden gibi varyant bilgilerini eklemek için
            </Text>
            <Button
              variant="outline"
              onClick={openDrawerForNew}
              style={{
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Varyant Ekle
            </Button>
          </Stack>
        )}
      </Card>
      <VariantForm
        defaultValues={selectedVariant || undefined}
        isEditing={isEditing}
        openDrawer={[opened, { open, close: handleDrawerClose, toggle }]}
        onSubmit={(data: Variant) => {
          try {
            let newCombinations: VariantProduct["variants"];
            const variantFieldsWithoutId = variantFields.map((field) => {
              const { id, ...rest } = field;
              return rest;
            });

            if (isEditing && editingIndex !== null) {
              newCombinations = updateVariantCombinations(
                variantFields,
                selectedVariantsFields,
                { type: "UPDATE", variant: data }
              );
              selectedVariantsUpdate(editingIndex, data);
              forceRerender(newCombinations);
            } else {
              selectedVariantsAppend(data);
              const selectedVariantsWithoutFormData =
                selectedVariantsFields.filter(
                  (variant) => variant.uniqueId !== data.uniqueId
                );
              newCombinations = generateCombination(
                selectedVariantsWithoutFormData,
                variantFieldsWithoutId,
                data
              );
              forceRerender(newCombinations);
            }

            replaceVariants(newCombinations);
            handleDrawerClose();
          } catch (error) {
            console.error("Varyant işleme hatası:", error);
          }
        }}
      />
      {variantCombinationIndex !== null && (
        <VariantCombinationDrawer
          opened={openedVariantCombination}
          watch={watch}
          setValue={setValue}
          onClose={() => {
            closeVariantCombination();
            setVariantCombinationIndex(null);
          }}
          control={control}
          index={variantCombinationIndex}
        />
      )}
      <VariantMediaDrawer
        opened={openedVariantMedia}
        control={control}
        watch={watch}
        onClose={() => {
          closeVariantMedia();
          setOpenedIndex(null);
        }}
        selectedIndex={selectedVariantCombination}
        setValue={setValue}
        openedIndex={openedIndex ?? 0}
      />
    </>
  );
};

export default VariantCard;
