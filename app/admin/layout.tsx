"use client";

import { useEffect, useState, useCallback } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Space, ConfigProvider, theme } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  TagsOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useMobileSidebar } from "@/hooks/useMobileSidebar";
import type { MenuProps } from "antd";
import Loading from "@/components/common/Loading";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import "../globals-layout.css";
import "./styles.css";

const { Header, Sider, Content } = Layout;

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

// menu items will be created inside the component so we can use `t()` for labels

function AdminLayoutContent({
  children,
  currentTheme,
}: {
  children: React.ReactNode;
  currentTheme: "light" | "dark";
}) {
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { role?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const { t } = useTranslation();
  const { isMobile, collapsed, mobileOpen, toggleSidebar, closeMobileSidebar } =
    useMobileSidebar();

  const menuItems: MenuItem[] = [
    getItem(t("admin.sidebar.dashboard"), "/admin", <DashboardOutlined />),
    getItem(t("admin.sidebar.seo"), "/admin/seo", <GlobalOutlined />),
    getItem(
      t("admin.sidebar.content") || "Content",
      "content",
      <FileTextOutlined />,
      [
        getItem(
          t("admin.sidebar.pages") || "Pages",
          "/admin/content/pages",
          <FileTextOutlined />
        ),
        getItem(
          t("admin.sidebar.categories") || "Categories",
          "/admin/content/categories",
          <TagsOutlined />
        ),
      ]
    ),
    getItem(
      t("admin.sidebar.users") || "User Management",
      "/admin/users",
      <TeamOutlined />
    ),
    getItem(
      t("admin.sidebar.transactions") || "Transactions",
      "/admin/transactions",
      <DollarOutlined />
    ),
    getItem(
      t("admin.sidebar.escrows") || "Escrow Holds",
      "/admin/escrows",
      <DollarOutlined />
    ),
    getItem(
      t("admin.sidebar.settings") || "Settings",
      "/admin/settings",
      <SettingOutlined />
    ),
  ];

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is admin (demo check - will be replaced with proper role check)
      const isAdmin =
        user.email === "admin@pr1as.com" ||
        user.user_metadata?.role === "admin";

      if (!isAdmin) {
        router.push("/");
        return;
      }

      setUser(user);
    } catch (error) {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: t("header.userMenu.profile") || "Profile",
      onClick: () => router.push("/admin/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("nav.logout") || "Logout",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
    closeMobileSidebar(); // Close sidebar on mobile when menu item is clicked
  };

  if (loading) {
    return (
      <Loading variant="fullPage" size="large" tip={t("common.loading")} />
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="mobile-backdrop mobile-backdrop-visible"
          onClick={closeMobileSidebar}
        />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? false : collapsed}
        onCollapse={(collapsed) => !isMobile && toggleSidebar()}
        breakpoint="lg"
        collapsedWidth="80"
        width={260}
        className={`
          ${isMobile ? "mobile-sidebar-overlay" : "desktop-sidebar"}
          ${isMobile && mobileOpen ? "mobile-sidebar-open" : ""}
          admin-sidebar
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
      >
        <div
          className={`sidebar-brand ${
            collapsed && !isMobile ? "collapsed" : ""
          }`}
        >
          <div className="brand-logo">PR</div>
          {(!collapsed || isMobile) && (
            <span className="brand-title">
              {`${t("header.brandName")} Admin`}
            </span>
          )}
        </div>
        <Menu
          mode="inline"
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
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: "pointer" }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.email}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          className="admin-content"
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

function AdminLayoutWithConfig({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <AdminLayoutContent currentTheme={currentTheme}>
        {children}
      </AdminLayoutContent>
    </ConfigProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AdminLayoutWithConfig>{children}</AdminLayoutWithConfig>
    </ThemeProvider>
  );
}
