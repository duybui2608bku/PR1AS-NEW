/**
 * Loading Component
 * Reusable loading component with multiple variants
 * Usage:
 *   <Loading /> - Default spinner
 *   <Loading variant="fullPage" /> - Full page loading
 *   <Loading variant="inline" /> - Inline loading
 *   <Loading variant="skeleton" /> - Skeleton loading
 */

"use client";

import { Spin, Skeleton } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";

export type LoadingVariant =
  | "spinner"
  | "fullPage"
  | "inline"
  | "skeleton"
  | "card";

export interface LoadingProps {
  variant?: LoadingVariant;
  size?: "small" | "default" | "large";
  tip?: string;
  fullHeight?: boolean;
  className?: string;
  style?: CSSProperties;
  skeletonRows?: number;
}

export default function Loading({
  variant = "spinner",
  size = "default",
  tip,
  fullHeight = false,
  className = "",
  style,
  skeletonRows = 3,
}: LoadingProps) {
  const { t } = useTranslation();

  const defaultTip = tip || t("common.loading") || "Đang tải...";

  const spinner = (
    <Spin
      size={size}
      tip={variant === "fullPage" ? defaultTip : undefined}
      indicator={
        <LoadingOutlined
          style={{
            fontSize: size === "large" ? 48 : size === "small" ? 16 : 24,
            color: "var(--color-primary, #690f0f)",
          }}
          spin
        />
      }
    />
  );

  // Full Page Loading
  if (variant === "fullPage") {
    return (
      <div
        className={`loading-full-page ${className}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          ...style,
        }}
      >
        {spinner}
        {defaultTip && (
          <p
            style={{
              marginTop: 16,
              color: "var(--text-secondary, #717171)",
              fontSize: 14,
            }}
          >
            {defaultTip}
          </p>
        )}
      </div>
    );
  }

  // Inline Loading
  if (variant === "inline") {
    return (
      <div
        className={`loading-inline ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: fullHeight ? "40px 0" : "20px 0",
          minHeight: fullHeight ? "200px" : "auto",
          ...style,
        }}
      >
        {spinner}
      </div>
    );
  }

  // Skeleton Loading
  if (variant === "skeleton") {
    return (
      <div className={`loading-skeleton ${className}`} style={style}>
        <Skeleton
          active
          paragraph={{ rows: skeletonRows }}
          title={{ width: "60%" }}
        />
      </div>
    );
  }

  // Card Loading
  if (variant === "card") {
    return (
      <div
        className={`loading-card ${className}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          minHeight: "300px",
          ...style,
        }}
      >
        {spinner}
        {defaultTip && (
          <p
            style={{
              marginTop: 16,
              color: "var(--text-secondary, #717171)",
              fontSize: 14,
            }}
          >
            {defaultTip}
          </p>
        )}
      </div>
    );
  }

  // Default Spinner
  return (
    <div
      className={`loading-spinner ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {spinner}
    </div>
  );
}

/**
 * Full Page Loading Component
 * Convenience component for full page loading
 */
export function FullPageLoading({
  tip,
  ...props
}: Omit<LoadingProps, "variant">) {
  return <Loading variant="fullPage" tip={tip} {...props} />;
}

/**
 * Inline Loading Component
 * Convenience component for inline loading
 */
export function InlineLoading({
  tip,
  ...props
}: Omit<LoadingProps, "variant">) {
  return <Loading variant="inline" tip={tip} {...props} />;
}

/**
 * Skeleton Loading Component
 * Convenience component for skeleton loading
 */
export function SkeletonLoading({
  skeletonRows,
  ...props
}: Omit<LoadingProps, "variant">) {
  return <Loading variant="skeleton" skeletonRows={skeletonRows} {...props} />;
}
