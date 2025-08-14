"use client";
import { TextInput, TextInputProps } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

interface PageHeaderSearchInputProps extends TextInputProps {
  searchKey: string;
}
const PageHeaderSearchInput = ({
  searchKey,
  ...props
}: PageHeaderSearchInputProps) => {
  const pageParams = useSearchParams();
  const { replace } = useRouter();
  const [search, setSearch] = useState<string>(pageParams.get(searchKey) || "");
  const handleSearchChange = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(pageParams.toString());
    if (query) {
      params.set(searchKey, query);
    } else {
      params.delete(searchKey);
    }
    replace(`?${params.toString()}`);
  }, 600);
  return (
    <TextInput
      type="search"
      value={search}
      leftSection={<IconSearch />}
      onChange={(event) => {
        setSearch(event.currentTarget.value);
        handleSearchChange(event.currentTarget.value);
      }}
      {...props}
    />
  );
};

export default PageHeaderSearchInput;
