import "./globals.css";
import {
  ColorSchemeScript,
  MantineColorsTuple,
  MantineProvider,
  createTheme,
  mantineHtmlProps,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Suspense } from "react";
import TanstackProvider from "./_components/TanstackProvider";

const primary: MantineColorsTuple = [
  "#ecf4ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc0",
  "#5f7cb7",
  "#5474b4",
  "#44639f",
  "#3a5890",
  "#2c4b80",
];

const theme = createTheme({
  colors: {
    primary,
  },
  cursorType: "pointer",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`antialiased min-h-screen flex flex-col relative`}>
        <Suspense>
          <TanstackProvider>
            <MantineProvider theme={theme}>
              <Notifications autoClose={2000} />
              {children}
            </MantineProvider>
          </TanstackProvider>
        </Suspense>
      </body>
    </html>
  );
}
