"use client";

import { ReactNode, useEffect, useState } from "react";
import { Currency, Locale } from "../generated/prisma";
import { getLocaleCurrencyDefaultValues } from "@/actions/helper-actions/currency-locale";

const LocaleCurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [localeCurrencyMap, setLocaleCurrencyMap] = useState<
    Map<Locale, Currency>
  >(new Map());
  useEffect(() => {
    const fetchData = async () => {
      const values = await getLocaleCurrencyDefaultValues();
      setLocaleCurrencyMap(
        new Map(values.items.map((item) => [item.locale, item.currency]))
      );
    };

    fetchData();
  }, []);

  return <div>{children}</div>;
};

export default LocaleCurrencyProvider;
