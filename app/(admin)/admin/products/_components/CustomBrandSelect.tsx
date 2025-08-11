"use client";

import {
  CloseButton,
  Combobox,
  Input,
  InputBase,
  InputBaseProps,
  Loader,
  useCombobox,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { fetchBrand } from "../_actions/fetch-brands";

interface CustomBrandSelectProps extends InputBaseProps {
  value?: string;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
}

const CustomBrandSelect = ({
  value,
  onChange,
  label = "Marka",
  disabled = false,
  size = "sm",
  variant = "default",
}: CustomBrandSelectProps) => {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<
    Array<{ id: string; name: string; level: number }>
  >([]);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => {
      if (brands.length === 0 && !loading) {
        loadBrands();
      }
    },
  });

  // Brand yükleme fonksiyonu
  const loadBrands = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await fetchBrand();
      if (result.success) {
        setBrands(result.data);
      }
    } catch (error) {
      console.error("Brand yükleme hatası:", error);
    } finally {
      setLoading(false);
      setHasInitiallyLoaded(true);
      combobox.resetSelectedOption();
    }
  };

  // useEffect: value varsa ve data henüz yüklenmemişse yükle
  useEffect(() => {
    if (value && brands.length === 0 && !loading && !hasInitiallyLoaded) {
      loadBrands();
    }
  }, [value, brands.length, loading, hasInitiallyLoaded]);

  // Seçili brand'i bul
  const selectedBrand = brands.find((brand) => brand.id === value);

  const options = brands.map((brand) => (
    <Combobox.Option
      value={brand.id}
      key={brand.id}
      style={{
        paddingLeft: `${8 + brand.level * 16}px`, // Level bazlı padding
        fontSize: brand.level === 0 ? "14px" : "13px",
        fontWeight: brand.level === 0 ? 500 : 400,
        color: brand.level === 0 ? "#000" : "#666",
      }}
    >
      {brand.name}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(optionValue) => {
        onChange?.(optionValue);
        combobox.closeDropdown();
      }}
      disabled={disabled}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          size={size}
          variant={variant}
          type="button"
          label={label}
          pointer
          rightSection={
            loading ? (
              <Loader size={18} />
            ) : value ? (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange?.(null);
                  combobox.closeDropdown();
                }}
                aria-label="Clear value"
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents={value ? "all" : "none"}
          disabled={disabled}
        >
          {selectedBrand ? (
            selectedBrand.name
          ) : value && loading ? (
            <span style={{ color: "#aaa" }}></span>
          ) : value && !selectedBrand && hasInitiallyLoaded ? (
            // Value var ama brand bulunamadı
            <span style={{ color: "#f03e3e" }}>Seçili marka bulunamadı</span>
          ) : (
            <Input.Placeholder></Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {loading ? (
            <Combobox.Empty></Combobox.Empty>
          ) : brands.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>Marka bulunamadı</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default CustomBrandSelect;
