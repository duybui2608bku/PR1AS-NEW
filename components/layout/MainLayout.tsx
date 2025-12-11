"use client";

import React from "react";
import { Layout, ConfigProvider, theme } from "antd";
import Header from "./Header";
import Footer from "./Footer";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { theme: currentTheme } = useTheme();
  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === "dark" ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: "#FF385C",
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 48,
            fontSize: 16,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 48,
            fontSize: 16,
          },
          Rate: {
            colorFillContent: "#FF385C",
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Header />
        <Content
          style={{
            minHeight: "calc(100vh - 64px - 200px)",
          }}
        >
          {children}
        </Content>
        <Footer />
      </Layout>
    </ConfigProvider>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProvider storageKey="site-theme">
      <MainLayoutContent>{children}</MainLayoutContent>
    </ThemeProvider>
  );
}
