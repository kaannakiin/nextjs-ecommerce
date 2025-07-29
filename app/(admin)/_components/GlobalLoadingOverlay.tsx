"use client";

import { LoadingOverlay, LoadingOverlayProps } from "@mantine/core";

interface GlobalLoadingOverlayProps extends LoadingOverlayProps {
  visible?: boolean;
}

const GlobalLoadingOverlay = ({
  visible = false,
  overlayProps = {
    radius: "md",
    blur: 2,
  },
  loaderProps = {
    type: "bars",
    color: "primary",
  },
  ...props
}: GlobalLoadingOverlayProps) => {
  return (
    <LoadingOverlay
      visible={visible}
      overlayProps={overlayProps}
      loaderProps={loaderProps}
      {...props}
    />
  );
};

export default GlobalLoadingOverlay;
