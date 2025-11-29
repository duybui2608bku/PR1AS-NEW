"use client";

import React from "react";
import { Layout, ConfigProvider } from "antd";
import Header from "./Header";
import Footer from "./Footer";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ConfigProvider
      theme={{
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
