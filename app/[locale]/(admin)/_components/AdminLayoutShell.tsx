"use client";
import { AppShell, Avatar, Burger, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Session } from "next-auth";
import React from "react";
import AdminNavbar from "./AdminNavbar";

const AdminLayoutShell = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" className="flex flex-col gap-3">
        <Group
          className="hover:bg-gray-100 transition-colors duration-75 rounded-4xl"
          p="sm"
        >
          <Avatar radius="xl" />

          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {session.user.name || "Admin User"}
            </Text>

            <Text c="dimmed" size="xs">
              {session.user.email || session.user.phone}
            </Text>
          </div>
        </Group>
        <AdminNavbar />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

export default AdminLayoutShell;
