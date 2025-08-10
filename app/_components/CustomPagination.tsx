"use client";
import { Pagination, PaginationProps } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface CustomPaginationProps extends Pick<PaginationProps, "total"> {
  paramKey: string;
}

const CustomPagination = ({ total, paramKey }: CustomPaginationProps) => {
  const params = useSearchParams();
  const { replace } = useRouter();

  return (
    <div className="flex justify-center items-center mt-auto py-5">
      <Pagination
        value={parseInt(params.get(paramKey) as string) || 1}
        onChange={(page) => {
          const newParams = new URLSearchParams(params.toString());

          if (page === 1) {
            newParams.delete(paramKey); // Sayfa 1 ise parametreyi sil
          } else {
            newParams.set(paramKey, page.toString()); // Sayfa 1 değilse parametreyi set et
          }

          replace(`?${newParams.toString()}`);
        }}
        total={total}
        size={"md"}
        color="primary"
      />
    </div>
  );
};

export default CustomPagination;
