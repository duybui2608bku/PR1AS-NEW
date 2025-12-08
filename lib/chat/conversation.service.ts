/**
 * Conversation Service
 * Business logic for creating and fetching chat conversations
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Conversation, ConversationWithLastMessage } from "./types";

export interface ConversationFilters {
  userId: string;
  role: "client" | "worker";
  page?: number;
  limit?: number;
}

export class ConversationService {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Find existing conversation for (client, worker, booking) or create a new one.
   * bookingId can be null for pre-booking chat.
   */
  async findOrCreateConversation(
    clientId: string,
    workerId: string,
    bookingId?: string | null
  ): Promise<Conversation> {
    const normalizedBookingId =
      bookingId === undefined ? null : bookingId || null;

    // Try to find existing conversation
    const { data: existing, error: findError } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("client_id", clientId)
      .eq("worker_id", workerId)
      .is("booking_id", normalizedBookingId)
      .maybeSingle<Conversation>();

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(
        `Failed to find conversation: ${findError.message || "Database error"}`
      );
    }

    if (existing) {
      return existing;
    }

    // Create new conversation
    const { data: created, error: createError } = await this.supabase
      .from("conversations")
      .insert({
        client_id: clientId,
        worker_id: workerId,
        booking_id: normalizedBookingId,
      })
      .select("*")
      .single<Conversation>();

    if (createError || !created) {
      throw new Error(
        `Failed to create conversation: ${
          createError?.message || "Database error"
        }`
      );
    }

    return created;
  }

  /**
   * Get conversations for a user (client or worker) with pagination.
   * Returns latest message joined as last_message, and user info for the other participant.
   */
  async getConversationsByUserId(
    filters: ConversationFilters
  ): Promise<{
    conversations: ConversationWithLastMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const column =
      filters.role === "client" ? "client_id" : "worker_id";
    const otherColumn =
      filters.role === "client" ? "worker_id" : "client_id";

    // First, get conversations with last message
    const query = this.supabase
      .from("conversations")
      .select(
        `
        *,
        last_message:messages!conversations_last_message_id_fkey(*)
      `,
        { count: "exact" }
      )
      .eq(column, filters.userId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    const { data, error, count } =
      await query.returns<ConversationWithLastMessage[]>();

    if (error) {
      throw new Error(
        `Failed to fetch conversations: ${error.message || "Database error"}`
      );
    }

    if (!data || data.length === 0) {
      return {
        conversations: [],
        total: count || 0,
        page,
        limit,
      };
    }

    // Get user IDs of the other participants
    const otherUserIds = Array.from(
      new Set(
        data
          .map((conv) => conv[otherColumn as keyof Conversation] as string)
          .filter(Boolean)
      )
    );

    // Fetch user profiles for the other participants
    let userProfileMap = new Map<
      string,
      { full_name?: string; avatar_url?: string; email?: string }
    >();

    if (otherUserIds.length > 0) {
      const { data: userProfiles } = await this.supabase
        .from("user_profiles")
        .select("id, email, full_name, avatar_url")
        .in("id", otherUserIds);

      if (userProfiles) {
        userProfileMap = new Map(
          userProfiles.map((profile) => [
            profile.id,
            {
              email: profile.email,
              full_name: profile.full_name || undefined,
              avatar_url: profile.avatar_url || undefined,
            },
          ])
        );
      }
    }

    // Enrich conversations with user info
    const enrichedConversations = data.map((conv) => {
      const otherUserId = conv[otherColumn as keyof Conversation] as string;
      const userInfo = userProfileMap.get(otherUserId);

      return {
        ...conv,
        other_user: userInfo
          ? {
              id: otherUserId,
              email: userInfo.email,
              full_name: userInfo.full_name,
              avatar_url: userInfo.avatar_url,
            }
          : {
              id: otherUserId,
              email: undefined,
              full_name: undefined,
              avatar_url: undefined,
            },
      };
    });

    return {
      conversations: enrichedConversations as ConversationWithLastMessage[],
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Get a single conversation by id ensuring the user is a participant.
   * Includes user info for the other participant.
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithLastMessage> {
    const { data, error } = await this.supabase
      .from("conversations")
      .select(
        `
        *,
        last_message:messages!conversations_last_message_id_fkey(*)
      `
      )
      .eq("id", conversationId)
      .or(`client_id.eq.${userId},worker_id.eq.${userId}`)
      .maybeSingle<ConversationWithLastMessage>();

    if (error) {
      throw new Error(
        `Failed to fetch conversation: ${error.message || "Database error"}`
      );
    }

    if (!data) {
      throw new Error("Conversation not found or access denied");
    }

    // Get the other user's ID
    const otherUserId =
      data.client_id === userId ? data.worker_id : data.client_id;

    // Fetch user profile for the other participant
    const { data: userProfile } = await this.supabase
      .from("user_profiles")
      .select("id, email, full_name, avatar_url")
      .eq("id", otherUserId)
      .maybeSingle();

    // Enrich conversation with user info
    return {
      ...data,
      other_user: userProfile
        ? {
            id: otherUserId,
            email: userProfile.email,
            full_name: userProfile.full_name || undefined,
            avatar_url: userProfile.avatar_url || undefined,
          }
        : {
            id: otherUserId,
            email: undefined,
            full_name: undefined,
            avatar_url: undefined,
          },
    } as ConversationWithLastMessage;
  }

  /**
   * Update last_message_id and last_message_at for a conversation.
   * Normally handled by DB trigger, but kept for completeness.
   */
  async updateLastMessage(
    conversationId: string,
    messageId: string,
    timestamp: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("conversations")
      .update({
        last_message_id: messageId,
        last_message_at: timestamp,
      })
      .eq("id", conversationId);

    if (error) {
      throw new Error(
        `Failed to update conversation last message: ${
          error.message || "Database error"
        }`
      );
    }
  }
}


