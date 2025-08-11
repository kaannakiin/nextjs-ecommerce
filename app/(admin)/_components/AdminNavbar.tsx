"use client";
import {
  Box,
  Collapse,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconPackageExport,
  IconSettings,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AdminNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [openedItems, setOpenedItems] = useState<string[]>([]);

  useEffect(() => {
    navbarData.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(
          (child) => child.href === pathname
        );

        const hasActiveSubPage = item.children.some((child) =>
          pathname.startsWith(child.href + "/")
        );

        if (
          (hasActiveChild || hasActiveSubPage) &&
          !openedItems.includes(item.title)
        ) {
          setOpenedItems((prev) => [...prev, item.title]);
        }
      }
    });
  }, [pathname]);

  const navbarData: {
    title: string;
    href?: string;
    icon: React.ReactNode;
    children?: {
      title: string;
      href: string;
    }[];
  }[] = [
    {
      title: "Anasayfa",
      icon: <IconHome size={24} />,
      children: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
        },
      ],
    },
    {
      title: "Ürünler",
      icon: <IconPackageExport size={24} />,
      children: [
        {
          href: "/admin/products",
          title: "Ürünler",
        },
        {
          href: "/admin/products/definitions",
          title: "Tanımlamalar",
        },
      ],
    },
    {
      title: "Ayarlar",
      icon: <IconSettings size={24} />,
      children: [
        { href: "/admin/settings", title: "Genel Ayarlar" },
        {
          href: "/admin/settings/localization",
          title: "Lokalizasyon",
        },
      ],
    },
  ];

  const toggleCollapse = (title: string) => {
    setOpenedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleItemClick = (item: (typeof navbarData)[0]) => {
    if (item.children && item.children.length > 0) {
      toggleCollapse(item.title);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const handleChildClick = (href: string) => {
    router.push(href);
  };

  // Bir child öğesinin aktif olup olmadığını kontrol eden fonksiyon - DÜZELTİLDİ
  const isChildActive = (
    childHref: string,
    allChildren: { href: string }[]
  ) => {
    // Önce tam eşleşme kontrolü
    if (pathname === childHref) {
      return true;
    }

    // Alt sayfa kontrolü yapmadan önce, diğer child'ların daha spesifik olup olmadığını kontrol et
    const moreSpecificChild = allChildren.find(
      (child) =>
        child.href !== childHref &&
        child.href.startsWith(childHref + "/") &&
        (pathname === child.href || pathname.startsWith(child.href + "/"))
    );

    // Eğer daha spesifik bir child aktifse, bu child aktif değil
    if (moreSpecificChild) {
      return false;
    }

    // Alt sayfa kontrolü
    return pathname.startsWith(childHref + "/");
  };

  return (
    <Box p="md">
      <Stack gap="xs">
        {navbarData.map((item) => (
          <Box key={item.title}>
            <UnstyledButton
              onClick={() => handleItemClick(item)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "transparent",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--mantine-color-gray-1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Group gap="md" style={{ flex: 1 }}>
                {item.icon}
                <Text size="sm" fw={500}>
                  {item.title}
                </Text>
              </Group>

              {/* Children varsa chevron ikonu göster */}
              {item.children && item.children.length > 0 && (
                <Box style={{ marginLeft: "auto" }}>
                  {openedItems.includes(item.title) ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </Box>
              )}
            </UnstyledButton>
            {item.children && item.children.length > 0 && (
              <Collapse in={openedItems.includes(item.title)}>
                <Stack
                  gap="xs"
                  style={{ paddingLeft: "48px", paddingTop: "8px" }}
                >
                  {item.children.map((child) => (
                    <UnstyledButton
                      key={child.href}
                      onClick={() => handleChildClick(child.href)}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: isChildActive(
                          child.href,
                          item.children!
                        )
                          ? "var(--mantine-color-blue-light)"
                          : "transparent",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isChildActive(child.href, item.children!)) {
                          e.currentTarget.style.backgroundColor =
                            "var(--mantine-color-gray-0)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isChildActive(child.href, item.children!)) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <Text
                        size="sm"
                        c={
                          isChildActive(child.href, item.children!)
                            ? "blue"
                            : "dimmed"
                        }
                        fw={
                          isChildActive(child.href, item.children!) ? 600 : 400
                        }
                      >
                        {child.title}
                      </Text>
                    </UnstyledButton>
                  ))}
                </Stack>
              </Collapse>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default AdminNavbar;
