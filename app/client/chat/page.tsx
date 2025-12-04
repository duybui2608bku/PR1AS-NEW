"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { createClient } from "@/lib/supabase/client";
import { ChatPage } from "@/components/chat/ChatPage";

export default function ClientChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spin size="large" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Vui lòng đăng nhập</p>
          <p className="text-sm">để sử dụng tính năng chat</p>
        </div>
      </div>
    );
  }

  return <ChatPage currentUserId={userId} />;
}
