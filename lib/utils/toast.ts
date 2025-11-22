import type { MessageInstance } from "antd/es/message/interface";
import type { NotificationInstance } from "antd/es/notification/interface";

// Singleton instances
let messageInstance: MessageInstance | null = null;
let notificationInstance: NotificationInstance | null = null;

// Set instances from hook
export const setMessageInstance = (instance: MessageInstance) => {
  messageInstance = instance;
};

export const setNotificationInstance = (instance: NotificationInstance) => {
  notificationInstance = instance;
};

// Message API - cho thông báo ngắn gọn
export const showMessage = {
  success: (content: string, duration: number = 3) => {
    messageInstance?.success(content, duration);
  },
  error: (content: string, duration: number = 3) => {
    messageInstance?.error(content, duration);
  },
  warning: (content: string, duration: number = 3) => {
    messageInstance?.warning(content, duration);
  },
  info: (content: string, duration: number = 3) => {
    messageInstance?.info(content, duration);
  },
  loading: (content: string, duration: number = 0) => {
    return messageInstance?.loading(content, duration);
  },
};

// Notification API - cho thông báo chi tiết hơn
export const showNotification = {
  success: (title: string, description?: string, duration: number = 4.5) => {
    notificationInstance?.success({
      message: title,
      description,
      duration,
      placement: "topRight",
    });
  },
  error: (title: string, description?: string, duration: number = 4.5) => {
    notificationInstance?.error({
      message: title,
      description,
      duration,
      placement: "topRight",
    });
  },
  warning: (title: string, description?: string, duration: number = 4.5) => {
    notificationInstance?.warning({
      message: title,
      description,
      duration,
      placement: "topRight",
    });
  },
  info: (title: string, description?: string, duration: number = 4.5) => {
    notificationInstance?.info({
      message: title,
      description,
      duration,
      placement: "topRight",
    });
  },
};

// Loading utilities
export const showLoading = {
  // Hiển thị loading message
  message: (content: string = "Đang tải...") => {
    return messageInstance?.loading(content, 0);
  },

  // Destroy loading message
  hide: () => {
    messageInstance?.destroy();
  },
};
