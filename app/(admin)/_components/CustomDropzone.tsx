"use client";

import {
  AspectRatio,
  Group,
  SimpleGrid,
  Text,
  ActionIcon,
  Alert,
  SimpleGridProps,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileRejection } from "@mantine/dropzone";
import {
  IconPhoto,
  IconUpload,
  IconX,
  IconTrash,
  IconAlertCircle,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface CustomDropzoneProps extends DropzoneProps {
  label: string;
  value: File[] | null;
  onRemove?: (index: number) => void;
  cols?: SimpleGridProps["cols"];
}

const CustomDropzone = ({
  label,
  value,
  onRemove,
  cols = { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }, // Varsayılan kolon sayıları
  ...props
}: CustomDropzoneProps) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const formatTranslations: Record<string, string> = {
    // Resim formatları
    jpeg: "JPEG",
    jpg: "JPG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    svg: "SVG",
    bmp: "BMP",
    tiff: "TIFF",

    // Belge formatları
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    txt: "Metin",
    rtf: "RTF",

    // Tablo formatları
    xls: "Excel",
    xlsx: "Excel",
    csv: "CSV",

    // Sunum formatları
    ppt: "PowerPoint",
    pptx: "PowerPoint",

    mp3: "MP3",
    wav: "WAV",
    ogg: "OGG",

    // Video formatları
    mp4: "MP4",
    avi: "AVI",
    mov: "MOV",
    webm: "WebM",

    // Arşiv formatları
    zip: "ZIP",
    rar: "RAR",
    "7z": "7Z",
  };

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
          // Çok fazla dosya hatası için sadece bir kez ekle
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

    // 3 saniye sonra hata mesajlarını temizle
    setTimeout(() => {
      setErrorMessages([]);
    }, 3000);

    // Eğer parent component'te onReject prop'u varsa onu da çağır
    if (props.onReject) {
      props.onReject(fileRejections);
    }
  };

  const getFormattedAcceptedTypes = () => {
    if (!Array.isArray(props?.accept)) {
      return "Desteklenen Dosyalar";
    }

    const formats = props.accept
      .map((type: string) => {
        const extension = type.split("/")[1];
        return formatTranslations[extension] || extension.toUpperCase();
      })
      .filter(Boolean);

    if (formats.length === 0) {
      return "Desteklenen Dosyalar";
    }

    if (formats.length === 1) {
      return formats[0];
    }

    if (formats.length === 2) {
      return `${formats[0]} ve ${formats[1]}`;
    }

    // 3 veya daha fazla format için
    const lastFormat = formats.pop();
    return `${formats.join(", ")} ve ${lastFormat}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <Text size="sm" fw={500}>
        {label}
      </Text>

      {/* Hata mesajları */}
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
            <Text size="xl" inline>
              {getFormattedAcceptedTypes()}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {props?.maxFiles
                ? `En fazla ${props.maxFiles} dosya`
                : "İstediğiniz kadar dosya"}{" "}
              ekleyebilirsiniz, her dosya{" "}
              {props?.maxSize ? `${props.maxSize / 1024 / 1024}MB` : "5MB"}{" "}
              geçmemelidir
            </Text>
          </div>
        </Group>
      </Dropzone>

      {value && value.length > 0 && (
        <SimpleGrid cols={cols} mt="md">
          {value.map((file, index) => (
            <AspectRatio
              ratio={1}
              key={index}
              className="relative overflow-hidden rounded-lg !bg-gray-100"
              style={{ height: "200px" }}
            >
              {onRemove && (
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
                  onClick={() => onRemove(index)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}

              {file.type.startsWith("image/") ? (
                <Image
                  fill
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{ objectFit: "contain" }}
                  className="object-contain h-full w-full"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="object-contain h-full w-full"
                  muted
                />
              )}
            </AspectRatio>
          ))}
        </SimpleGrid>
      )}
    </div>
  );
};

export default CustomDropzone;
