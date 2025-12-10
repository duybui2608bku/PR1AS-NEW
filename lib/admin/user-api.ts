// Admin API client for user management
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  banned_until?: string;
  email_confirmed_at: string;
  last_sign_in_at: string;
  user_metadata: {
    role?: string;
    full_name?: string;
  };
  profile?: any;
}

export interface WorkerImage {
  id: string;
  image_url: string;
  image_type: "avatar" | "gallery";
  display_order: number;
  is_approved: boolean;
}

export interface WorkerServicePrice {
  id: string;
  price_usd?: number;
  price_vnd?: number;
  price_jpy?: number;
  price_krw?: number;
  price_cny?: number;
  primary_currency: string;
}

export interface WorkerService {
  id: string;
  service_id: string;
  is_active: boolean;
  services?: {
    id: string;
    name_key?: string;
    slug?: string;
    description?: string;
  };
  worker_service_prices?: WorkerServicePrice[];
}

export interface PendingWorker {
  id: string;
  user_id: string;
  full_name: string;
  nickname?: string;
  age: number;
  height_cm?: number;
  weight_kg?: number;
  zodiac_sign?: string;
  lifestyle?: string;
  personal_quote?: string;
  bio?: string;
  profile_status: string;
  created_at: string;
  user?: any;
  user_profiles?: any;
  worker_images?: WorkerImage[];
  worker_services?: WorkerService[];
}

class AdminUserAPI {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const jsonData = await response.json();

      if (!response.ok) {
        return { error: jsonData.error || "Request failed" };
      }

      // API returns { success: true, data: T, message?: string }
      // Unwrap the data property
      if (jsonData.success && jsonData.data !== undefined) {
        return { data: jsonData.data, message: jsonData.message };
      }

      // Fallback for non-standard responses
      return { data: jsonData, message: jsonData.message };
    } catch (error) {
      return { error: "Network error" };
    }
  }

  // Get all users
  async getAllUsers(): Promise<ApiResponse<{ users: User[]; total: number }>> {
    return this.makeRequest<{ users: User[]; total: number }>(
      "/api/admin/users"
    );
  }

  // Ban user
  async banUser(userId: string, duration?: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users/ban", {
      method: "POST",
      body: JSON.stringify({ userId, duration }),
    });
  }

  // Unban user
  async unbanUser(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users/unban", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Delete user
  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users/delete", {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    });
  }

  // Approve worker
  async approveWorker(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users/approve-worker", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Update user role
  async updateUserRole(
    userId: string,
    role: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/admin/users/update-role", {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    });
  }

  // Get pending workers
  async getPendingWorkers(): Promise<
    ApiResponse<{ workers: PendingWorker[]; total: number }>
  > {
    return this.makeRequest<{ workers: PendingWorker[]; total: number }>(
      "/api/admin/users/pending-workers"
    );
  }
}

export const adminUserAPI = new AdminUserAPI();
