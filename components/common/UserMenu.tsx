"use client";

import { useState, useEffect } from "react";
import { Dropdown, Avatar, Space, Typography, Spin } from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
  DashboardOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/auth/api-client";
import { showMessage } from "@/lib/utils/toast";
import { useTranslation } from "react-i18next";
import Loading from "@/components/common/Loading";

const { Text } = Typography;

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: "client" | "worker" | "admin";
  status: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      showMessage.success(t("header.userMenu.logoutSuccess"));
      router.push("/auth/login");
    } catch (error) {
      showMessage.error(t("header.userMenu.logoutError"));
    }
  };

  if (loading) {
    return <Loading variant="spinner" size="small" />;
  }

  if (!user) {
    return null;
  }

  const getRoleName = (role: string) => {
    return t(`header.userMenu.roles.${role}`) || role;
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "8px 0" }}>
          <Space>
            <Avatar
              size={48}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#690f0f" }}
            />
            <div>
              <Text strong style={{ display: "block", fontSize: 16 }}>
                {user.full_name || t("header.userMenu.user")}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user.email}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "#f0f0f0",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {getRoleName(user.role)}
                </Text>
              </div>
            </div>
          </Space>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "dashboard",
      label: t("header.userMenu.dashboard"),
      icon: <DashboardOutlined />,
    },
    {
      key: "profile",
      label: t("header.userMenu.profile"),
      icon: <IdcardOutlined />,
    },
    ...(user.role === "worker"
      ? [
          {
            key: "profile-setup",
            label: t("header.userMenu.profileSetup"),
            icon: <SettingOutlined />,
          },
        ]
      : []),
    {
      type: "divider",
    },
    {
      key: "logout",
      label: t("header.userMenu.logout"),
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const getDashboardUrl = (role: string) => {
    const dashboardUrls = {
      client: "/client/dashboard",
      worker: "/worker/dashboard",
      admin: "/admin/dashboard",
    };
    return dashboardUrls[role as keyof typeof dashboardUrls] || "/";
  };

  const getProfileUrl = (role: string) => {
    const profileUrls = {
      client: "/client/profile",
      worker: `/workers/${user.id}`,
      admin: "/admin/profile",
    };
    return profileUrls[role as keyof typeof profileUrls] || "/profile";
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      handleLogout();
    } else if (key === "dashboard") {
      router.push(getDashboardUrl(user.role));
    } else if (key === "profile") {
      router.push(getProfileUrl(user.role));
    } else if (key === "profile-setup") {
      router.push("/worker/profile/setup");
    }
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={(menu) => (
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow:
              "0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)",
            minWidth: 280,
          }}
        >
          {menu}
        </div>
      )}
    >
      <div
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#690f0f" }}
          />
          <Text
            style={{
              display: "inline-block",
            }}
            className="hidden sm:inline-block"
          >
            {user.full_name || user.email}
          </Text>
          <DownOutlined
            style={{ fontSize: 12 }}
            className="hidden sm:inline-block"
          />
        </Space>
      </div>
    </Dropdown>
  );
}
