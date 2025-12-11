"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  ConfigProvider,
  theme,
  Modal,
} from "antd";
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
  HomeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useMobileSidebar } from "@/hooks/useMobileSidebar";
import { authAPI } from "@/lib/auth/api-client";
import type { MenuProps } from "antd";
import Loading from "@/components/common/Loading";
import ThemeToggle from "@/components/common/ThemeToggle";
import NavigationLoadingBar from "@/components/common/NavigationLoadingBar";
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
  const [sessionWarningVisible, setSessionWarningVisible] = useState(false);
  const [sessionExpiringSoon, setSessionExpiringSoon] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const { t, i18n } = useTranslation();
  const { isMobile, collapsed, mobileOpen, toggleSidebar, closeMobileSidebar } =
    useMobileSidebar();
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const menuItems: MenuItem[] = [
    getItem(t("nav.home") || "Home", "/", <HomeOutlined />),
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

  const checkAuth = useCallback(
    async (tryRefresh = false) => {
      try {
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();

        // If token expired and we haven't tried refresh yet, try to refresh
        if ((getUserError || !user) && !tryRefresh) {
          try {
            await authAPI.refreshToken();
            // Retry after refresh
            return checkAuth(true);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            router.push("/auth/login");
            return;
          }
        }

        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Check if user is admin by querying user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          // No profile found, redirect to login
          router.push("/auth/login");
          return;
        }

        // Check if user is banned
        if (profile.status === "banned") {
          router.push("/banned");
          return;
        }

        // Check if user has admin role
        if (profile.role !== "admin") {
          router.push("/");
          return;
        }

        setUser(user);
      } catch (error) {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  // Check token expiration and set up auto-refresh
  const setupTokenRefresh = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        return;
      }

      const expiresAt = session.data.session.expires_at;
      if (!expiresAt) {
        return;
      }

      // Clear existing intervals
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
      if (sessionWarningTimeoutRef.current) {
        clearTimeout(sessionWarningTimeoutRef.current);
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = expiresAt - now;

      // If token already expired or expires in less than 1 minute, refresh immediately
      if (expiresIn <= 60) {
        try {
          await authAPI.refreshToken();
          // Reset the check after successful refresh
          setupTokenRefresh();
          return;
        } catch (error) {
          // Refresh failed, redirect to login
          router.push("/auth/login");
          return;
        }
      }

      // Show warning 5 minutes before expiration (300 seconds)
      const warningTime = expiresIn - 300;

      if (warningTime > 0) {
        sessionWarningTimeoutRef.current = setTimeout(() => {
          setSessionWarningVisible(true);
          setSessionExpiringSoon(true);
        }, warningTime * 1000);
      } else if (expiresIn <= 300 && expiresIn > 60) {
        // Already within 5 minutes but more than 1 minute, show warning immediately
        setSessionWarningVisible(true);
        setSessionExpiringSoon(true);
      }

      // Auto-refresh token 1 minute before expiration (60 seconds)
      const refreshTime = expiresIn - 60;

      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            await authAPI.refreshToken();
            // Reset the check after successful refresh
            setupTokenRefresh();
          } catch (error) {
            // Refresh failed, show error and redirect
            setSessionWarningVisible(false);
            router.push("/auth/login");
          }
        }, refreshTime * 1000);
      }

      // Check token expiration every 30 seconds
      tokenCheckIntervalRef.current = setInterval(async () => {
        try {
          const currentSession = await supabase.auth.getSession();
          if (!currentSession.data.session) {
            // Session lost, try refresh
            try {
              await authAPI.refreshToken();
              setupTokenRefresh();
            } catch (error) {
              router.push("/auth/login");
            }
          } else {
            // Check if token is expiring soon
            const currentExpiresAt = currentSession.data.session.expires_at;
            if (currentExpiresAt) {
              const currentNow = Math.floor(Date.now() / 1000);
              const currentExpiresIn = currentExpiresAt - currentNow;

              // If expiring in less than 1 minute, refresh
              if (currentExpiresIn <= 60) {
                try {
                  await authAPI.refreshToken();
                  setupTokenRefresh();
                } catch (error) {
                  router.push("/auth/login");
                }
              }
            }
          }
        } catch (error) {
          console.error("Error checking token expiration:", error);
        }
      }, 30000); // Check every 30 seconds
    } catch (error) {
      console.error("Error setting up token refresh:", error);
    }
  }, [supabase, router]);

  const handleExtendSession = async () => {
    try {
      await authAPI.refreshToken();
      setSessionWarningVisible(false);
      setSessionExpiringSoon(false);
      setupTokenRefresh();
    } catch (error) {
      // Refresh failed, redirect to login
      setSessionWarningVisible(false);
      router.push("/auth/login");
    }
  };

  const handleLogoutFromWarning = async () => {
    setSessionWarningVisible(false);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    checkAuth().then(() => {
      // Set up token refresh after initial auth check
      setupTokenRefresh();
    });

    // Force admin panel to always use Vietnamese
    i18n.changeLanguage("vi");

    // Cleanup intervals on unmount
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
      if (sessionWarningTimeoutRef.current) {
        clearTimeout(sessionWarningTimeoutRef.current);
      }
    };
  }, [checkAuth, setupTokenRefresh, i18n]);

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
    <>
      <NavigationLoadingBar />
      {/* Session timeout warning modal */}
      <Modal
        open={sessionWarningVisible}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>
              {t("admin.session.warningTitle") || "Session Expiring Soon"}
            </span>
          </Space>
        }
        onOk={handleExtendSession}
        onCancel={handleLogoutFromWarning}
        okText={t("admin.session.extend") || "Extend Session"}
        cancelText={t("admin.session.logout") || "Logout"}
        closable={false}
        maskClosable={false}
        centered
      >
        <p>
          {t("admin.session.warningMessage") ||
            "Your session will expire in a few minutes. Would you like to extend your session?"}
        </p>
      </Modal>
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
    </>
  );
}

function AdminLayoutWithConfig({ children }: { children: React.ReactNode }) {
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
