"use client";

import { Layout, Menu, Button, Space, ConfigProvider, theme } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  WalletOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
  MessageOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMobileSidebar } from "@/hooks/useMobileSidebar";
import UserMenu from "@/components/common/UserMenu";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import NavigationLoadingBar from "@/components/common/NavigationLoadingBar";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import type { MenuProps } from "antd";
import "../globals-layout.css";

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

function ClientLayoutContent({
  children,
  currentTheme,
}: {
  children: React.ReactNode;
  currentTheme: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { isMobile, collapsed, mobileOpen, toggleSidebar, closeMobileSidebar } =
    useMobileSidebar();

  const menuItems: MenuItem[] = [
    getItem(t("nav.home") || "Home", "/", <HomeOutlined />),
    getItem(
      t("client.sidebar.dashboard") || "Bảng điều khiển",
      "/client/dashboard",
      <DashboardOutlined />
    ),
    getItem(
      t("client.sidebar.myWallet") || "My Wallet",
      "/client/wallet",
      <WalletOutlined />
    ),
    getItem(
      t("booking.title") || "My Bookings",
      "/client/bookings",
      <CalendarOutlined />
    ),
    getItem(
      t("client.sidebar.messages") || "Messages",
      "/client/chat",
      <MessageOutlined />
    ),
    getItem(t("nav.profile") || "Profile", "/client/profile", <UserOutlined />),
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
    closeMobileSidebar(); // Close sidebar on mobile when menu item is clicked
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <NavigationLoadingBar />
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="mobile-backdrop mobile-backdrop-visible"
          onClick={closeMobileSidebar}
        />
      )}

      <Sider
        collapsible
        collapsed={isMobile ? false : collapsed}
        onCollapse={(collapsed) => !isMobile && toggleSidebar()}
        breakpoint="lg"
        collapsedWidth="80"
        width={260}
        className={`
          ${isMobile ? "mobile-sidebar-overlay" : "desktop-sidebar"}
          ${isMobile && mobileOpen ? "mobile-sidebar-open" : ""}
        `}
        theme={currentTheme === "dark" ? "dark" : "light"}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
        trigger={null}
      >
        <div
          className={`sidebar-brand ${
            collapsed && !isMobile ? "collapsed" : ""
          }`}
        >
          <div className="brand-logo">PR</div>
          {(!collapsed || isMobile) && (
            <span className="brand-title">
              {t("client.dashboard.title") || "Client Panel"}
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          theme={currentTheme === "dark" ? "dark" : "light"}
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout
        className={`${
          isMobile ? "mobile-layout-content" : "desktop-layout-content"
        }`}
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
          transition: isMobile ? "none" : "all 0.2s",
        }}
      >
        <Header className="layout-header">
          <Button
            type="text"
            icon={
              collapsed && !isMobile ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={toggleSidebar}
            className="mobile-menu-button"
          />
          <Space size="middle">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserMenu />
          </Space>
        </Header>
        <Content
          style={{
            margin: isMobile ? 0 : "24px 16px",
            padding: isMobile ? 0 : 24,
            minHeight: 280,
            borderRadius: isMobile ? 0 : 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

function ClientLayoutWithConfig({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme();
  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === "dark" ? darkAlgorithm : defaultAlgorithm,
        token: {
          fontFamily: "var(--font-family-base)",
          fontSize: 14,
          colorPrimary: "#FF385C",
          borderRadius: 8,
        },
        components: {
          Rate: {
            colorFillContent: "#FF385C",
          },
        },
      }}
    >
      <ClientLayoutContent currentTheme={currentTheme}>
        {children}
      </ClientLayoutContent>
    </ConfigProvider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider storageKey="client-theme">
      <ClientLayoutWithConfig>{children}</ClientLayoutWithConfig>
    </ThemeProvider>
  );
}
