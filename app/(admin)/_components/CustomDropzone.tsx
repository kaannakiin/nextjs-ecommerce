"use client";

import { AssetType } from "@/app/generated/prisma";
import {
  ActionIcon,
  Alert,
  AspectRatio,
  Group,
  SimpleGrid,
  SimpleGridProps,
  Text,
  Popover,
  Button,
  Stack,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileRejection } from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";

interface CustomDropzoneProps extends DropzoneProps {
  label: string;
  value: File[] | null;
  onRemove?: (index: number) => void;
  cols?: SimpleGridProps["cols"];
  existingImages?: { url: string; type: AssetType }[];
  onRemoveExisting?: (index: number, imageUrl: string) => void;
}

const CustomDropzone = ({
  label,
  value,
  onRemove,
  cols = { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  existingImages = [],
  onRemoveExisting,
  ...props
}: CustomDropzoneProps) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [deletePopover, setDeletePopover] = useState<{
    open: boolean;
    type: "existing" | "new";
    index: number;
    imageUrl?: string;
  }>({ open: false, type: "new", index: -1 });

  const errorTranslations: Record<string, string> = {
    "file-invalid-type": "Desteklenmeyen dosya formatı",
    "file-too-large": "Dosya boyutu çok büyük",
    "file-too-small": "Dosya boyutu çok küçük",
    "too-many-files": "Çok fazla dosya seçildi",
  };

  const handleReject = (fileRejections: FileRejection[]) => {
    const errors: string[] = [];
    let tooManyFilesError = false;

    fileRejections.forEach((rejection) => {
      rejection.errors.forEach((error) => {
        const translatedError = errorTranslations[error.code] || error.message;
        const fileName = rejection.file.name;

        if (error.code === "file-too-large") {
          const maxSizeMB = props.maxSize
            ? (props.maxSize / 1024 / 1024).toFixed(1)
            : "5";
          errors.push(`${fileName}: ${translatedError} (Max: ${maxSizeMB}MB)`);
        } else if (error.code === "too-many-files") {
          if (!tooManyFilesError) {
            const maxFiles = props.maxFiles || "sınırsız";
            errors.push(`${translatedError} (Max: ${maxFiles} dosya)`);
            tooManyFilesError = true;
          }
        } else {
          errors.push(`${fileName}: ${translatedError}`);
        }
      });
    });

    setErrorMessages(errors);

    setTimeout(() => {
      setErrorMessages([]);
    }, 3000);

    if (props.onReject) {
      props.onReject(fileRejections);
    }
  };

  const handleDeleteExisting = (index: number, imageUrl: string) => {
    if (onRemoveExisting) {
      onRemoveExisting(index, imageUrl);
    }
    setDeletePopover({ open: false, type: "new", index: -1 });
  };

  const handleDeleteNew = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
    setDeletePopover({ open: false, type: "new", index: -1 });
  };

  const totalImages = existingImages.length + (value?.length || 0);
  const hasImages = totalImages > 0;

  return (
    <div className="flex flex-col gap-1">
      <Text size="sm" fw={500}>
        {label}
      </Text>

      {errorMessages.length > 0 && (
        <div className="space-y-2">
          {errorMessages.map((error, index) => (
            <Alert
              key={index}
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              className="!bg-red-50 !border-red-200"
            >
              <Text size="sm" className="!text-red-700">
                {error}
              </Text>
            </Alert>
          ))}
        </div>
      )}

      <Dropzone
        {...props}
        onReject={handleReject}
        className="!bg-gray-200 hover:!bg-white transition-colors duration-300 ease-in-out rounded-lg p-4"
      >
        <Group
          justify="center"
          gap={"xl"}
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              size={52}
              color="var(--mantine-color-blue-6)"
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              size={52}
              color="var(--mantine-color-dimmed)"
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="md" inline>
              Medya yüklemek için tıklayın ya da bu alana sürükleyin
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {props?.maxFiles
                ? `En fazla ${props.maxFiles} dosya`
                : "İstediğiniz kadar dosya"}
              ekleyebilirsiniz, her dosya
              {props?.maxSize ? `${props.maxSize / 1024 / 1024}MB` : "5MB"}
              geçmemelidir
            </Text>
          </div>
        </Group>
      </Dropzone>

      {hasImages && (
        <SimpleGrid cols={cols} mt="md">
          {existingImages.map((image, index) => (
            <AspectRatio
              ratio={1}
              key={`existing-${index}`}
              className="relative overflow-hidden rounded-lg "
              style={{ height: "200px" }}
            >
              {onRemoveExisting && (
                <Popover
                  opened={
                    deletePopover.open &&
                    deletePopover.type === "existing" &&
                    deletePopover.index === index
                  }
                  onClose={() =>
                    setDeletePopover({ open: false, type: "new", index: -1 })
                  }
                  onDismiss={() => {
                    setDeletePopover({ open: false, type: "new", index: -1 });
                  }}
                  position="top"
                  withArrow
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="sm"
                      className="absolute z-10"
                      style={{
                        top: "8px",
                        left: "8px",
                        width: "28px",
                        height: "28px",
                        minWidth: "28px",
                        minHeight: "28px",
                      }}
                      onClick={() =>
                        setDeletePopover({
                          open: true,
                          type: "existing",
                          index,
                          imageUrl: image.url,
                        })
                      }
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown
                    className="border-[var(--mantine-color-primary-6)]"
                    p={"md"}
                  >
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        Resmi silmek istiyor musunuz?
                      </Text>
                      <Group gap="xs" justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            setDeletePopover({
                              open: false,
                              type: "new",
                              index: -1,
                            })
                          }
                        >
                          Hayır
                        </Button>
                        <Button
                          size="xs"
                          variant="filled"
                          color="red"
                          onClick={() => handleDeleteExisting(index, image.url)}
                        >
                          Evet
                        </Button>
                      </Group>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              )}

              {image.type === "IMAGE" ? (
                <Image
                  fill
                  src={image.url}
                  alt="Mevcut resim"
                  style={{ objectFit: "contain" }}
                  className="object-contain h-full w-full"
                />
              ) : (
                <video
                  src={image.url}
                  className="object-contain h-full w-full"
                  muted
                />
              )}
            </AspectRatio>
          ))}

          {value?.map((file, index) => (
            <AspectRatio
              ratio={1}
              key={`new-${index}`}
              className="relative overflow-hidden rounded-lg"
              style={{ height: "200px" }}
            >
              {onRemove && (
                <Popover
                  opened={
                    deletePopover.open &&
                    deletePopover.type === "new" &&
                    deletePopover.index === index
                  }
                  onClose={() =>
                    setDeletePopover({ open: false, type: "new", index: -1 })
                  }
                  onDismiss={() => {
                    setDeletePopover({ open: false, type: "new", index: -1 });
                  }}
                  position="top"
                  withArrow
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="sm"
                      className="absolute z-10"
                      style={{
                        top: "8px",
                        left: "8px",
                        width: "28px",
                        height: "28px",
                        minWidth: "28px",
                        minHeight: "28px",
                      }}
                      onClick={() =>
                        setDeletePopover({
                          open: true,
                          type: "new",
                          index,
                        })
                      }
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown
                    className="border-[var(--mantine-color-primary-6)]"
                    p={"md"}
                  >
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        Resmi silmek istiyor musunuz?
                      </Text>
                      <Group gap="xs" align="flex-end" justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            setDeletePopover({
                              open: false,
                              type: "new",
                              index: -1,
                            })
                          }
                        >
                          Hayır
                        </Button>
                        <Button
                          size="xs"
                          variant="filled"
                          color="red"
                          onClick={() => handleDeleteNew(index)}
                        >
                          Evet
                        </Button>
                      </Group>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              )}

              {(() => {
                if (!file) return null;

                const fileType = file.type || "";
                const isImage = fileType.startsWith("image/");
                const isVideo = fileType.startsWith("video/");

                if (isImage) {
                  return (
                    <Image
                      fill
                      src={URL.createObjectURL(file)}
                      alt={file.name || "Image"}
                      style={{ objectFit: "contain" }}
                      className="object-contain h-full w-full"
                    />
                  );
                }

                if (isVideo) {
                  return (
                    <video
                      src={URL.createObjectURL(file)}
                      className="object-contain h-full w-full"
                      muted
                    />
                  );
                }

                return (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <Text size="sm" c="dimmed">
                      Desteklenmeyen dosya tipi
                    </Text>
                  </div>
                );
              })()}
            </AspectRatio>
          ))}
        </SimpleGrid>
      )}
    </div>
  );
};

export default CustomDropzone;
