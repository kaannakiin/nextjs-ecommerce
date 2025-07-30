"use client";

import { fetchVariants } from "@/actions/helper-actions/fetch-variants";
import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import ObjectDeleteModal from "@/app/(admin)/_components/ObjectDeleteModal";
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
  Combobox,
  DEFAULT_THEME,
  Divider,
  Drawer,
  DrawerOverlay,
  Group,
  InputBase,
  Modal,
  Popover,
  Radio,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useDebouncedCallback, useDisclosure } from "@mantine/hooks";
import {
  IconCornerDownLeft,
  IconEdit,
  IconGripVertical,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import ReactDOM from "react-dom";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import styles from "./RadioCard.module.css";

interface VariantFormProps {
  defaultValues?: Variant;
}

const VariantForm = ({ defaultValues }: VariantFormProps) => {
  const [comboboxData, setComboboxData] = useState<Variant[]>([]);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({});
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [colorModalOpened, { open: openColorModal, close: closeColorModal }] =
    useDisclosure(false);
  const isAnyPopoverOpen = Object.values(popoverOpen).some(Boolean);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const {
    control,
    formState: { isSubmitting, errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<Variant>({
    resolver: zodResolver(VariantSchema),
    defaultValues: defaultValues || {
      options: [],
      translations: [{ locale: "TR", name: "" }],
      type: "CHOICE",
    },
  });

  const type = watch("type") || "COLOR";
  const watchedFields = watch("options");
  const search = watch("translations.0.name") || "";
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "options",
  });

  const openModalForField = (index: number) => {
    setActiveModalIndex(index);
    openColorModal();
  };

  const handleCloseModal = () => {
    closeColorModal();
    setActiveModalIndex(null);
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
    closeDrawer();
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

  const exactOptionMatch = comboboxData.some(
    (item) =>
      item.translations
        .find((translation) => translation.locale === "TR")
        ?.name.toLowerCase() === search.toLowerCase().trim()
  );

  const filteredOptions = exactOptionMatch
    ? comboboxData
    : comboboxData.filter((item) =>
        item.translations.find((translation) =>
          translation.name.toLowerCase().includes(search.toLowerCase().trim())
        )
      );

  const options = filteredOptions
    .map((variant, index) => {
      if (!variant.uniqueId) {
        return null;
      }
      return (
        <Combobox.Option key={variant.uniqueId} value={variant.uniqueId}>
          {variant.translations.find((t) => t.locale === "TR")?.name ||
            variant.translations[0]?.name ||
            "Varyant Adı"}
        </Combobox.Option>
      );
    })
    .filter(Boolean); // null değerleri filtrele

  const onSubmit: SubmitHandler<Variant> = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <>
      <Drawer.Root
        onClose={handleDrawerClose}
        opened={drawerOpened}
        position="right"
        size={"lg"}
        pos={"relative"}
        closeOnEscape={!colorModalOpened && !isAnyPopoverOpen}
        closeOnClickOutside={!colorModalOpened && !isAnyPopoverOpen}
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
              <Combobox
                store={combobox}
                withinPortal={false} // VEYA bu satırı tamamen kaldırın (varsayılanı false'tur)
                zIndex={10002}
                position="bottom-start"
                onOptionSubmit={(value) => {
                  console.log("Selected option:", value);
                  combobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <Controller
                    control={control}
                    name="translations.0.name"
                    render={({ field, fieldState }) => (
                      <InputBase
                        error={fieldState.error?.message}
                        value={field.value}
                        onBlur={() => {
                          combobox.closeDropdown();
                          field.onBlur();
                        }}
                        onClick={() => combobox.openDropdown()}
                        onFocus={() => combobox.openDropdown()}
                        onChange={(e) => {
                          combobox.openDropdown();
                          combobox.updateSelectedOptionIndex();
                          field.onChange(e.currentTarget.value);
                          handleChange(e.currentTarget.value);
                        }}
                        label="Varyant Türü Adı"
                        withAsterisk
                        placeholder="e.g: Renk, Beden"
                      />
                    )}
                  />
                </Combobox.Target>
                <Combobox.Options>
                  {options}
                  {!exactOptionMatch && search.trim().length > 0 && (
                    <Combobox.Option value="$create">
                      + {search}
                    </Combobox.Option>
                  )}
                </Combobox.Options>
              </Combobox>

              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Radio.Group {...field}>
                    <SimpleGrid cols={{ xs: 1, md: 2 }}>
                      <Radio.Card
                        value={VariantType.CHOICE}
                        className={styles.root}
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
                )}
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
                      if (value.length < 3) {
                        setErrorMessage(
                          "Varyant adı en az 3 karakter olmalıdır."
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
                        uniqueId: null,
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
                        return (
                          <Draggable
                            key={field.id}
                            index={index}
                            draggableId={field.id}
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
                                  if (!snapshot.isDragging) {
                                    e.currentTarget.style.background =
                                      "rgba(249, 250, 251, 1)";
                                    e.currentTarget.style.borderColor =
                                      "rgba(229, 231, 235, 1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!snapshot.isDragging) {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.borderColor =
                                      "transparent";
                                  }
                                }}
                              >
                                <Group gap={"xs"}>
                                  <div
                                    {...provided.dragHandleProps}
                                    style={{
                                      cursor: "grab",
                                      padding: "4px",
                                      borderRadius: "4px",
                                      color: "#6b7280",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "rgba(59, 130, 246, 0.1)";
                                      e.currentTarget.style.color = "#3b82f6";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                      e.currentTarget.style.color = "#6b7280";
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
                                  <Text fw={400} c="gray.8">
                                    {trTranslations.name}
                                  </Text>
                                </Group>
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
                                          onClick={() => closePopover(field.id)}
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

      {activeModalIndex !== null && (
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
