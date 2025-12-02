"use client";

import { Layout, Menu, Button, Space } from "antd";
import {
  DashboardOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  UserOutlined,
  WalletOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMobileSidebar } from "@/hooks/useMobileSidebar";
import UserMenu from "@/components/common/UserMenu";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
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

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { isMobile, collapsed, mobileOpen, toggleSidebar, closeMobileSidebar } =
    useMobileSidebar();

  const menuItems: MenuItem[] = [
    getItem(
      t("nav.home") || "Dashboard",
      "/client/dashboard",
      <DashboardOutlined />
    ),
    getItem("My Wallet", "/client/wallet", <WalletOutlined />),
    getItem(
      t("booking.title") || "My Bookings",
      "/client/bookings",
      <CalendarOutlined />
    ),
    getItem("Post Job", "/client/post-job", <PlusOutlined />),
    getItem("My Jobs", "/client/my-jobs", <UnorderedListOutlined />),
    getItem(t("nav.profile") || "Profile", "/client/profile", <UserOutlined />),
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
    closeMobileSidebar(); // Close sidebar on mobile when menu item is clicked
  };

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
        style={{
          background: "#fff",
          borderRight: "1px solid #f0f0f0",
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
            <LanguageSwitcher />
            <UserMenu />
          </Space>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
