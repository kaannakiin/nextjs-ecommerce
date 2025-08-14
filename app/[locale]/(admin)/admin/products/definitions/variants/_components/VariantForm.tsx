"use client";

import { fetchVariants } from "@/actions/helper-actions/fetch-variants";
import { VariantType } from "@/app/generated/prisma";
import {
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  Variant,
  VariantSchema,
} from "@/schemas/product-schema";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionIcon,
  Button,
  ColorPicker,
  ColorSwatch,
  DEFAULT_THEME,
  Divider,
  Drawer,
  Group,
  Modal,
  Popover,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  useDebouncedCallback,
  useDisclosure,
  UseDisclosureReturnValue,
} from "@mantine/hooks";
import { createId } from "@paralleldrive/cuid2";
import {
  IconCornerDownLeft,
  IconEdit,
  IconGripVertical,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import styles from "./RadioCard.module.css";
import GlobalLoadingOverlay from "@/app/[locale]/(admin)/_components/GlobalLoadingOverlay";
import ObjectDeleteModal from "@/app/[locale]/(admin)/_components/ObjectDeleteModal";
import CustomDropzone from "@/app/[locale]/(admin)/_components/CustomDropzone";

interface VariantFormProps {
  defaultValues?: Variant;
  openDrawer: UseDisclosureReturnValue;
  onSubmit?: SubmitHandler<Variant>;
  isEditing?: boolean; // Yeni prop ekle
}

const VariantForm = ({
  defaultValues,
  openDrawer,
  onSubmit: onSubmitParent,
  isEditing = false, // Default false
}: VariantFormProps) => {
  const [comboboxData, setComboboxData] = useState<Variant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({});
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [colorModalOpened, { open: openColorModal, close: closeColorModal }] =
    useDisclosure(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isAnyPopoverOpen = Object.values(popoverOpen).some(Boolean);

  const {
    control,
    formState: { isSubmitting, errors },
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<Variant>({
    resolver: zodResolver(VariantSchema),
    defaultValues: defaultValues || {
      uniqueId: createId(),
      options: [],
      translations: [{ locale: "TR", name: "" }] as Variant["translations"],
      type: "CHOICE" as Variant["type"],
    },
  });
  useEffect(() => {
    if (defaultValues && isEditing) {
      reset(defaultValues);
    } else if (!isEditing) {
      reset({
        uniqueId: createId(),
        options: [],
        translations: [{ locale: "TR", name: "" }] as Variant["translations"],
        type: "CHOICE" as Variant["type"],
      });
    }
  }, [defaultValues, isEditing, reset]);
  const type = watch("type") || "COLOR";
  const watchedFields = watch("options");
  const nameValue = watch("translations.0.name");
  const selectedVariant = comboboxData.find(
    (variant) =>
      variant.uniqueId === nameValue ||
      variant.translations.some(
        (t) => t.locale === "TR" && t.name === nameValue
      )
  );

  const isDbVariant = Boolean(selectedVariant);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "options",
  });

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const openModalForField = (index: number) => {
    if (type === "CHOICE") {
      setEditingIndex(index);
    } else {
      setActiveModalIndex(index);
      openColorModal();
    }
  };

  const handleCloseModal = () => {
    closeColorModal();
    setActiveModalIndex(null);
    setEditingIndex(null);
  };

  const closePopover = (fieldId: string) => {
    setPopoverOpen((prev) => ({
      ...prev,
      [fieldId]: false,
    }));
  };

  const handleDrawerClose = () => {
    setPopoverOpen({});
    handleCloseModal();
    openDrawer[1].close();

    // Edit modunda değilse veya defaultValues yoksa temiz form
    const resetValues =
      isEditing && defaultValues
        ? defaultValues
        : {
            uniqueId: createId(),
            options: [],
            translations: [
              { locale: "TR", name: "" },
            ] as Variant["translations"],
            type: "CHOICE" as Variant["type"],
          };

    reset(resetValues);
  };

  const activeField =
    activeModalIndex !== null ? fields[activeModalIndex] : null;
  const activeFieldName =
    activeField?.translations.find((t) => t.locale === "TR")?.name || "";

  const handleChange = useDebouncedCallback(async (value: string) => {
    if (value.length < 3) {
      setComboboxData([]);
      return;
    }

    const response = await fetchVariants(value);
    if (response.success && response.variants) {
      setComboboxData(response.variants);
    } else {
      setComboboxData([]);
    }
  }, 500);

  const handleEditSave = (index: number, newName: string) => {
    if (newName.trim()) {
      setValue(`options.${index}.translations.0.name`, newName.trim(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setEditingIndex(null);
  };

  const onSubmit: SubmitHandler<Variant> = (data) => {
    if (onSubmitParent) {
      onSubmitParent(data);
      handleDrawerClose();
    }
  };

  return (
    <>
      <Drawer.Root
        onClose={handleDrawerClose}
        opened={openDrawer[0]}
        position="right"
        size={"lg"}
        transitionProps={{
          transition: "slide-left",
          duration: 300,
          timingFunction: "linear",
        }}
        pos={"relative"}
        closeOnEscape={
          !colorModalOpened && !isAnyPopoverOpen && editingIndex === null
        }
        closeOnClickOutside={
          !colorModalOpened && !isAnyPopoverOpen && editingIndex === null
        }
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title fz={"h4"} fw={700}>
              Varyant {`${defaultValues ? "Düzenle" : "Ekle"}`}
            </Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>
          <Drawer.Body
            style={{
              overflow: "visible",
            }}
          >
            <GlobalLoadingOverlay visible={isSubmitting} />
            <Stack gap={"md"}>
              <Group justify="flex-end" gap={"md"}>
                <Button variant="outline" type="button">
                  Vazgeç
                </Button>
                <Button
                  variant="filled"
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                >
                  Kaydet
                </Button>
              </Group>
              <Controller
                control={control}
                name={`translations.0.name`}
                render={({ field, fieldState }) => {
                  return (
                    <Select
                      label="Varyant Türü Adı"
                      withAsterisk
                      data-autofocus
                      {...field}
                      error={fieldState.error?.message}
                      searchable
                      searchValue={field.value}
                      clearable
                      disabled={isDbVariant}
                      placeholder={
                        isDbVariant
                          ? "Seçili varyant (değiştirilemez)"
                          : "Varyant ara veya yeni ekle"
                      }
                      onClear={() => {
                        field.onChange("");
                        setComboboxData([]);
                        reset({
                          uniqueId: createId(),
                          options: [],
                          translations: [
                            { locale: "TR", name: "" },
                          ] as Variant["translations"],
                          type: "CHOICE" as Variant["type"],
                        });
                      }}
                      data={comboboxData
                        .filter(
                          (val) =>
                            val.uniqueId !== null && val.uniqueId !== undefined
                        )
                        .map((value) => ({
                          value:
                            value.translations.find(
                              (translation) => translation.locale === "TR"
                            )?.name ||
                            value.translations[0]?.name ||
                            "Varyant Adı",
                          label:
                            value.translations.find(
                              (translation) => translation.locale === "TR"
                            )?.name ||
                            value.translations[0]?.name ||
                            "Varyant Adı",
                        }))}
                      onSearchChange={(searchValue) => {
                        if (!isDbVariant) {
                          field.onChange(searchValue.trim());
                          setValue(`translations.0.name`, searchValue.trim());
                          handleChange(searchValue.trim());
                        }
                      }}
                      onBlur={() => {
                        if (!isDbVariant) {
                          field.onChange(field.value.trim());
                          setValue(`translations.0.name`, field.value.trim());
                          handleChange(field.value.trim());
                        }
                      }}
                      onChange={(value) => {
                        if (!value) return;

                        const exactVariant = comboboxData.find((variant) =>
                          variant.translations.some(
                            (t) => t.locale === "TR" && t.name === value
                          )
                        );

                        if (exactVariant) {
                          reset({
                            ...exactVariant,
                          });
                        } else {
                          field.onChange(value);
                        }
                      }}
                    />
                  );
                }}
              />
              <Controller
                control={control}
                name="type"
                render={({ field, fieldState }) => {
                  return (
                    <Radio.Group {...field} error={fieldState.error?.message}>
                      <SimpleGrid cols={{ xs: 1, md: 2 }}>
                        <Radio.Card
                          disabled={isDbVariant}
                          value={VariantType.CHOICE}
                          className={styles.root}
                          style={{
                            opacity: isDbVariant ? 0.6 : 1,
                            cursor: isDbVariant ? "not-allowed" : "pointer",
                            pointerEvents: isDbVariant ? "none" : "auto",
                            backgroundColor: isDbVariant
                              ? "#f8f9fa"
                              : undefined,
                            borderColor: isDbVariant ? "#dee2e6" : undefined,
                          }}
                        >
                          <Group wrap="nowrap" align="flex-start" gap={"xs"}>
                            <Radio.Indicator
                              variant="outline"
                              color={"primary"}
                            />
                            <div style={{ width: "100%" }}>
                              <Text className="font-bold text-base leading-tight text-gray-900 dark:text-white">
                                Liste
                              </Text>
                              <Group
                                mt="sm"
                                gap="xs"
                                align="center"
                                wrap="nowrap"
                              >
                                <div
                                  style={{
                                    padding: "6px 12px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    backgroundColor: "white",
                                    minWidth: "80px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    position: "relative",
                                  }}
                                >
                                  XL
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    style={{ marginLeft: "8px" }}
                                  >
                                    <path
                                      d="M3 4.5L6 7.5L9 4.5"
                                      stroke="#666"
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "white",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                  }}
                                >
                                  S
                                </div>
                                <div
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                  }}
                                >
                                  M
                                </div>
                              </Group>
                            </div>
                          </Group>
                        </Radio.Card>

                        <Radio.Card
                          style={{
                            opacity: isDbVariant ? 0.6 : 1,
                            cursor: isDbVariant ? "not-allowed" : "pointer",
                            pointerEvents: isDbVariant ? "none" : "auto",
                            backgroundColor: isDbVariant
                              ? "#f8f9fa"
                              : undefined,
                            borderColor: isDbVariant ? "#dee2e6" : undefined,
                          }}
                          disabled={isDbVariant}
                          value={VariantType.COLOR}
                          className={styles.root}
                        >
                          <Group wrap="nowrap" align="flex-start" gap={"xs"}>
                            <Radio.Indicator
                              variant="outline"
                              color={"primary"}
                            />
                            <div style={{ width: "100%" }}>
                              <Text className="font-bold text-base leading-tight text-gray-900 dark:text-white">
                                Renk / Görsel
                              </Text>
                              <Group mt="sm" gap="xs">
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "white",
                                    border: "1px solid #ddd",
                                  }}
                                ></div>
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#64748b",
                                    border: "1px solid #ddd",
                                  }}
                                ></div>
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666",
                                  }}
                                >
                                  <IconPhoto size={24} />
                                </div>
                              </Group>
                            </div>
                          </Group>
                        </Radio.Card>
                      </SimpleGrid>
                    </Radio.Group>
                  );
                }}
              />
              <TextInput
                label="Varyant"
                withAsterisk
                placeholder="e.g: Kırmızı, Mavi"
                rightSection={<IconCornerDownLeft size={24} />}
                error={errorMessage || errors.options?.message}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setErrorMessage(null);
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      if (value.length < 1) {
                        setErrorMessage(
                          "Varyant adı en az 1 karakter olmalıdır."
                        );
                        setTimeout(() => {
                          setErrorMessage(null);
                        }, 2000);
                        return;
                      }
                      if (
                        fields.some((field) =>
                          field.translations.some(
                            (t) => t.locale === "TR" && t.name === value
                          )
                        )
                      ) {
                        setErrorMessage("Bu varyant zaten mevcut.");
                        setTimeout(() => {
                          setErrorMessage(null);
                        }, 2000);
                        return;
                      }
                      append({
                        translations: [{ locale: "TR", name: value }],
                        value: "#000000",
                        image: null,
                        existingImages: null,
                        uniqueId: createId(),
                      });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <DragDropContext
                onDragEnd={({ destination, source }) => {
                  if (!destination || destination.index === source.index) {
                    return;
                  }
                  move(source.index, destination.index);
                }}
              >
                <Droppable
                  droppableId="dnd-list"
                  direction="vertical"
                  renderClone={(provided, snapshot, rubric) => {
                    const field = fields[rubric.source.index];
                    const trTranslations =
                      field.translations.find((t) => t.locale === "TR") ||
                      field.translations[0];

                    return ReactDOM.createPortal(
                      <Group
                        align="center"
                        justify="space-between"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: DEFAULT_THEME.colors.gray[0],
                          boxShadow: DEFAULT_THEME.shadows.md,
                          padding: "var(--mantine-spacing-md)",
                          minWidth: "280px",
                          maxWidth: "400px",
                        }}
                      >
                        <Group gap={"xs"} {...provided.dragHandleProps}>
                          <IconGripVertical size={24} />
                          <Text fw={500}>{trTranslations.name}</Text>
                        </Group>
                      </Group>,
                      document.body
                    );
                  }}
                >
                  {(provided) => (
                    <Stack
                      gap={"md"}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {fields.map((field, index) => {
                        const trTranslations =
                          field.translations.find((t) => t.locale === "TR") ||
                          field.translations[0];
                        const isEditing = editingIndex === index;

                        return (
                          <Draggable
                            key={field.id}
                            index={index}
                            draggableId={field.id}
                            isDragDisabled={isEditing}
                          >
                            {(provided, snapshot) => (
                              <Group
                                align="center"
                                justify="space-between"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  display: snapshot.isDragging
                                    ? "none"
                                    : "flex",
                                  padding: "var(--mantine-spacing-xs) 0",
                                  borderRadius: "8px",
                                  background: snapshot.isDragging
                                    ? "rgba(59, 130, 246, 0.1)"
                                    : "transparent",
                                  border: "1px solid transparent",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!snapshot.isDragging && !isEditing) {
                                    e.currentTarget.style.background =
                                      "rgba(249, 250, 251, 1)";
                                    e.currentTarget.style.borderColor =
                                      "rgba(229, 231, 235, 1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!snapshot.isDragging && !isEditing) {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.borderColor =
                                      "transparent";
                                  }
                                }}
                              >
                                <Group gap={"xs"} style={{ flex: 1 }}>
                                  <div
                                    {...provided.dragHandleProps}
                                    style={{
                                      cursor: isEditing ? "default" : "grab",
                                      padding: "4px",
                                      borderRadius: "4px",
                                      color: "#6b7280",
                                      transition: "all 0.2s ease",
                                      opacity: isEditing ? 0.5 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isEditing) {
                                        e.currentTarget.style.background =
                                          "rgba(59, 130, 246, 0.1)";
                                        e.currentTarget.style.color = "#3b82f6";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isEditing) {
                                        e.currentTarget.style.background =
                                          "transparent";
                                        e.currentTarget.style.color = "#6b7280";
                                      }
                                    }}
                                  >
                                    <IconGripVertical size={20} />
                                  </div>
                                  {type === "COLOR" && (
                                    <div>
                                      {watchedFields?.[index]
                                        ?.existingImages ? (
                                        <ObjectDeleteModal
                                          type={
                                            watchedFields[index].existingImages
                                              .type
                                          }
                                          url={
                                            watchedFields[index].existingImages
                                              .url
                                          }
                                        />
                                      ) : watchedFields?.[index]?.image ? (
                                        <ObjectDeleteModal
                                          renderThumbnail={false}
                                          type={
                                            watchedFields?.[
                                              index
                                            ]?.image?.type.startsWith("image/")
                                              ? "IMAGE"
                                              : "VIDEO"
                                          }
                                          url={URL.createObjectURL(
                                            watchedFields?.[index]?.image
                                          )}
                                          onDelete={() => {
                                            setValue(
                                              `options.${index}.image`,
                                              null,
                                              {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                              }
                                            );
                                            return Promise.resolve({
                                              success: true,
                                            });
                                          }}
                                        />
                                      ) : (
                                        <ColorSwatch
                                          onClick={() =>
                                            openModalForField(index)
                                          }
                                          color={
                                            watchedFields?.[index]?.value ||
                                            field.value ||
                                            "#000000"
                                          }
                                          withShadow={false}
                                          size={28}
                                          radius={"sm"}
                                          style={{
                                            cursor: "pointer",
                                            transition: "transform 0.2s ease",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform =
                                              "scale(1.1)";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform =
                                              "scale(1)";
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {isEditing ? (
                                    <TextInput
                                      ref={editInputRef}
                                      defaultValue={trTranslations.name}
                                      size="sm"
                                      style={{ flex: 1 }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleEditSave(
                                            index,
                                            e.currentTarget.value
                                          );
                                        } else if (e.key === "Escape") {
                                          setEditingIndex(null);
                                        }
                                      }}
                                      onBlur={(e) => {
                                        handleEditSave(
                                          index,
                                          e.currentTarget.value
                                        );
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <Text
                                      fw={400}
                                      c="gray.8"
                                      style={{
                                        cursor:
                                          type === "CHOICE"
                                            ? "pointer"
                                            : "default",
                                        flex: 1,
                                      }}
                                      onClick={() => {
                                        setEditingIndex(index);
                                      }}
                                    >
                                      {trTranslations.name}
                                    </Text>
                                  )}
                                </Group>

                                {!isEditing && (
                                  <Group gap={"xs"}>
                                    <ActionIcon
                                      variant="subtle"
                                      color="gray"
                                      size="sm"
                                      onClick={() => openModalForField(index)}
                                    >
                                      <IconEdit size={16} />
                                    </ActionIcon>
                                    <Popover
                                      opened={popoverOpen[field.id] || false}
                                      onChange={(opened) =>
                                        setPopoverOpen((prev) => ({
                                          ...prev,
                                          [field.id]: opened,
                                        }))
                                      }
                                      width={300}
                                      position="top-end"
                                      withArrow
                                      arrowSize={12}
                                      shadow="lg"
                                      closeOnEscape={!colorModalOpened}
                                    >
                                      <Popover.Target>
                                        <ActionIcon
                                          variant="subtle"
                                          color="gray"
                                          size="sm"
                                          onClick={() =>
                                            setPopoverOpen((prev) => ({
                                              ...prev,
                                              [field.id]: !prev[field.id],
                                            }))
                                          }
                                        >
                                          <IconTrash size={16} />
                                        </ActionIcon>
                                      </Popover.Target>
                                      <Popover.Dropdown>
                                        <Text fw={700} size="sm">
                                          Bu varyantı silmek istediğinize emin
                                          misiniz?
                                        </Text>
                                        <Divider my={"sm"} />
                                        <Group gap={"md"} grow={true}>
                                          <Button
                                            onClick={() =>
                                              closePopover(field.id)
                                            }
                                            variant="outline"
                                            size="xs"
                                          >
                                            Hayır
                                          </Button>
                                          <Button
                                            color={"red"}
                                            onClick={() => {
                                              remove(index);
                                              closePopover(field.id);
                                            }}
                                            size="xs"
                                          >
                                            Evet
                                          </Button>
                                        </Group>
                                      </Popover.Dropdown>
                                    </Popover>
                                  </Group>
                                )}
                              </Group>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </DragDropContext>
            </Stack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      {activeModalIndex !== null && type === "COLOR" && (
        <Modal
          opened={colorModalOpened}
          onClose={handleCloseModal}
          title={`${activeFieldName} - Renk/Görsel Seçimi`}
          size="md"
          centered
          padding="lg"
          trapFocus={true}
          closeOnEscape={true}
          closeOnClickOutside={true}
          zIndex={1000}
        >
          <Tabs defaultValue="color">
            <Tabs.List grow>
              <Tabs.Tab value="color">Renk</Tabs.Tab>
              <Tabs.Tab value="image">Görsel</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="color" pt="md">
              <Controller
                control={control}
                name={`options.${activeModalIndex}.value`}
                render={({ field: colorField }) => (
                  <Stack align="center" gap="md">
                    <ColorPicker
                      {...colorField}
                      size="lg"
                      format="hex"
                      swatches={[
                        "#25262b",
                        "#868e96",
                        "#fa5252",
                        "#e64980",
                        "#be4bdb",
                        "#7950f2",
                        "#4c6ef5",
                        "#228be6",
                        "#15aabf",
                        "#12b886",
                        "#40c057",
                        "#82c91e",
                        "#fab005",
                        "#fd7e14",
                      ]}
                      onChange={(value) => {
                        colorField.onChange(value);
                        setValue(`options.${activeModalIndex}.value`, value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                    <Text size="sm" c="dimmed" ta="center">
                      Renk seçimini yapın veya hex kodunu girin
                    </Text>
                  </Stack>
                )}
              />
            </Tabs.Panel>

            <Tabs.Panel value="image" pt="md">
              <Controller
                control={control}
                name={`options.${activeModalIndex}.image`}
                render={({ field: dropzoneField }) => (
                  <CustomDropzone
                    cols={1}
                    label="Görsel Yükle"
                    onDrop={(files) => {
                      dropzoneField.onChange(files[0]);
                      setValue(
                        `options.${activeModalIndex}.existingImages`,
                        null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                      setValue(`options.${activeModalIndex}.image`, files[0], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    value={dropzoneField.value ? [dropzoneField.value] : null}
                    accept={IMAGE_MIME_TYPE}
                    maxSize={PRODUCT_ASSET_MEDIA_MAX_SIZE}
                    maxFiles={PRODUCT_ASSET_MAX_FILES}
                    onRemove={() => dropzoneField.onChange(null)}
                  />
                )}
              />
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={handleCloseModal}>
              Kapat
            </Button>
          </Group>
        </Modal>
      )}
    </>
  );
};

export default VariantForm;
