"use server";

import { ActionResponse } from "@/types/globalTypes";
import * as Minio from "minio";
import { createId } from "@paralleldrive/cuid2";
import sharp from "sharp";
import { version } from "node:punycode";

interface UploadFileMinio {
  file: File;
  bucketName: string;
  isNeedOg?: boolean;
  isNeedThumbnail?: boolean;
}

interface UploadedFile {
  originalUrl: string;
  ogImageUrl?: string;
  thumbnailUrl?: string;
}

const minioClient = new Minio.Client({
  port: 443,
  useSSL: true,
  region: "us-east-1",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  endPoint: process.env.MINIO_ENDPOINT!,
});

async function bucketExistOrCreate(
  bucketName: string
): Promise<ActionResponse> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      await minioClient.setBucketPolicy(
        bucketName,
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [
                `arn:aws:s3:::${bucketName}/*`,
                `arn:aws:s3:::${bucketName}`,
              ],
            },
          ],
        })
      );
    }
    return {
      success: true,
      message: `Bucket ${bucketName} is ready.`,
    };
  } catch (error) {
    console.error(`Error creating or accessing bucket ${bucketName}:`, error);
    return {
      success: false,
      message: `Error creating or accessing bucket ${bucketName}: ${error}`,
    };
  }
}

async function processAndUploadImage(
  buffer: Buffer,
  fileName: string,
  bucketName: string,
  format: "webp" | "jpeg",
  suffix?: string,
  blur?: boolean
): Promise<string> {
  let sharpInstance = sharp(buffer);

  // Apply blur if needed (for thumbnail)
  if (blur) {
    sharpInstance = sharpInstance.blur(10); // Maximum blur
  }

  // Convert to specified format
  let processedBuffer: Buffer;
  if (format === "webp") {
    processedBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
  } else {
    processedBuffer = await sharpInstance.jpeg({ quality: 85 }).toBuffer();
  }

  // Create filename with suffix
  const finalFileName = suffix
    ? `${fileName}${suffix}.${format}`
    : `${fileName}.${format}`;

  // Upload to Minio
  await minioClient.putObject(
    bucketName,
    finalFileName,
    processedBuffer,
    processedBuffer.length,
    {
      "Content-Type": `image/${format}`,
    }
  );

  return `https://cdn.playflexdesign.com/${bucketName}/${finalFileName}`;
}

export async function uploadFileToMinio({
  bucketName,
  file,
  isNeedOg = false,
  isNeedThumbnail = false,
}: UploadFileMinio): Promise<
  ActionResponse & {
    data?: UploadedFile;
  }
> {
  try {
    // Check if bucket exists or create it
    const bucketResponse = await bucketExistOrCreate(bucketName);
    if (!bucketResponse.success) {
      return bucketResponse;
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${createId()}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadedFile: UploadedFile = {
      originalUrl: "",
      ogImageUrl: undefined,
      thumbnailUrl: undefined,
    };

    // Upload original image as WebP
    uploadedFile.originalUrl = await processAndUploadImage(
      buffer,
      fileName,
      bucketName,
      "webp"
    );

    // Upload OG image if needed (JPEG format)
    if (isNeedOg) {
      uploadedFile.ogImageUrl = await processAndUploadImage(
        buffer,
        fileName,
        bucketName,
        "jpeg",
        "-og-image"
      );
    }

    // Upload thumbnail if needed (WebP format with blur)
    if (isNeedThumbnail) {
      uploadedFile.thumbnailUrl = await processAndUploadImage(
        buffer,
        fileName,
        bucketName,
        "webp",
        "-thumbnail",
        true // Apply blur
      );
    }

    return {
      success: true,
      message: `File ${file.name} uploaded successfully to bucket ${bucketName}.`,
      data: uploadedFile,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      message: `Error uploading file: ${error}`,
    };
  }
}

export async function getObject({ url }: { url: string }) {
  try {
    if (!url) {
      return null;
    }
    const bucketName = url.split("/")[3];
    const objectName = url.split("/").slice(4).join("/");
    // Önce dosya metadata'sını al
    const stat = await minioClient.statObject(bucketName, objectName);
    const contentType =
      stat.metaData?.["content-type"] || "application/octet-stream";

    const object = await minioClient.getObject(bucketName, objectName);
    const chunks = [];
    for await (const chunk of object) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const file = new File([buffer], objectName, {
      type: contentType,
      lastModified: stat.lastModified?.getTime() || Date.now(),
    });

    return file;
  } catch (error) {
    console.error("Error getting object from Minio:", error);
    return null;
  }
}

export async function DeleteObject({
  url,
}: {
  url: string;
}): Promise<ActionResponse> {
  try {
    if (!url) {
      return {
        success: false,
        message: "Url gerekli.",
      };
    }
    const bucketName = url.split("/")[3];
    const objectName = url.split("/").slice(4).join("/");
    const deleteResponse = await minioClient.removeObject(
      bucketName,
      objectName
    );
    return {
      success: true,
      message: `Nesne ${objectName} başarıyla silindi.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Nesne silinirken hata oluştu.`,
    };
  }
}
