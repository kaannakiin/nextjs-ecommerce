"use client";

import { uploadFileToMinio } from "@/actions/helper-actions/minio-actions";
import { tr } from "@/lib/helperData";
import { ProductImageSchema } from "@/schemas/product-schema";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { Divider, Text } from "@mantine/core";
import {
  HTMLAttributes,
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
} from "react";
import { treeifyError } from "zod";

interface CustomRichTextEditorProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onChange" | "onSelectionChange" | "children"
  > {
  label: string;
  value?: string; // React Hook Form için value prop'u
  onChange?: (value: string) => void; // React Hook Form için onChange prop'u
  theme?: "light" | "dark";
  editable?: boolean;
  onSelectionChange?: () => void;
  children?: ReactNode;
  error?: string;
}

const CustomRichTextEditor = forwardRef<
  HTMLDivElement,
  CustomRichTextEditorProps
>(
  (
    {
      label,
      value = "",
      onChange,
      theme = "light",
      editable = true,
      onSelectionChange,
      children,
      error,
      ...props
    },
    ref
  ) => {
    const editor = useCreateBlockNote({
      dictionary: { ...tr },
      uploadFile: async (file) => {
        if (!file) {
          throw new Error("No file provided");
        }
        const { success, data, error } = ProductImageSchema.safeParse(file);

        if (!success) {
          throw new Error(treeifyError(error).errors.join(", "));
        }

        const response = await uploadFileToMinio({
          bucketName: "rich-text-editor",
          file,
          isNeedOg: false,
          isNeedThumbnail: false,
        });

        if (!response.success || !response.data?.originalUrl) {
          throw new Error(response.message || "Upload failed");
        }

        return response.data.originalUrl;
      },
    });

    // Value değiştiğinde editörü güncelle
    useEffect(() => {
      const updateEditor = async () => {
        if (value && editor) {
          try {
            if (typeof value === "string" && value.trim()) {
              const blocks = editor.tryParseHTMLToBlocks(value);
              editor.replaceBlocks(editor.document, await blocks);
            } else if (!value) {
              editor.replaceBlocks(editor.document, []);
            }
          } catch (error) {
            console.warn("Error parsing HTML to blocks:", error);
          }
        }
      };

      updateEditor();
    }, [value, editor]);

    const handleEditorChange = async () => {
      if (onChange && editor) {
        try {
          const html = await editor.blocksToHTMLLossy(editor.document);
          onChange(html);
        } catch (error) {
          console.warn("Error converting blocks to HTML:", error);
          onChange("");
        }
      }
    };

    // Ref'i expose et
    useImperativeHandle(ref, () => {
      const div = document.createElement("div");
      return div;
    });

    return (
      <div className="flex flex-col gap-1" ref={ref} {...props}>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        {error && (
          <Text c={"red"} fz={"sm"}>
            {error}
          </Text>
        )}
        <Divider my={"2px"} />
        <BlockNoteView
          editor={editor}
          theme={theme}
          editable={editable}
          onSelectionChange={onSelectionChange}
          onChange={handleEditorChange}
        >
          {children}
        </BlockNoteView>
      </div>
    );
  }
);

CustomRichTextEditor.displayName = "CustomRichTextEditor";

export default CustomRichTextEditor;
