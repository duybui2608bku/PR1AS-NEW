"use client";

import "@ant-design/v5-patch-for-react-19";
import { useEffect } from "react";
import { App, ConfigProvider } from "antd";
import { setMessageInstance, setNotificationInstance } from "@/lib/utils/toast";

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { message, notification } = App.useApp();

  useEffect(() => {
    setMessageInstance(message);
    setNotificationInstance(notification);
  }, [message, notification]);

  return <>{children}</>;
}

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
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
      <App>
        <AntdProvider>{children}</AntdProvider>
      </App>
    </ConfigProvider>
  );
}
