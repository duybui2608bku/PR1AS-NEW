import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin Supabase client with service role key
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// GET /api/admin/users/pending-workers
export async function GET() {
  try {
    const supabase = getAdminSupabase();

    // Get worker profiles that are pending approval
    const { data: pendingWorkers, error } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("profile_status", "pending");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch pending workers", details: error.message },
        { status: 500 }
      );
    }

    if (!pendingWorkers || pendingWorkers.length === 0) {
      return NextResponse.json({
        workers: [],
        total: 0,
      });
    }

    // Get additional data for each worker
    const workersWithDetails = await Promise.all(
      (pendingWorkers || []).map(async (worker) => {
        try {
          // Get auth user data
          let userData = null;
          try {
            const { data, error: userError } =
              await supabase.auth.admin.getUserById(worker.user_id);
            if (!userError && data) {
              userData = data.user;
            }
          } catch (err) {
            // Silent error handling
          }

          // Get user profile
          let userProfile = null;
          try {
            const { data } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("id", worker.user_id)
              .single();
            userProfile = data;
          } catch (err) {
            // Silent error handling
          }

          // Get worker images
          let images = [];
          try {
            const { data } = await supabase
              .from("worker_images")
              .select("*")
              .eq("worker_profile_id", worker.id)
              .order("display_order");
            images = data || [];
          } catch (err) {
            // Silent error handling
          }

          // Get worker services
          let servicesWithPrices = [];
          try {
            const { data: services, error: servicesError } = await supabase
              .from("worker_services")
              .select("*")
              .eq("worker_profile_id", worker.id);

            if (!servicesError && services && services.length > 0) {
              // Get service details and prices for each service
              servicesWithPrices = await Promise.all(
                services.map(async (service) => {
                  let serviceDetails = null;
                  let prices = [];

                  // Get service details
                  try {
                    const { data: serviceData, error: serviceError } =
                      await supabase
                        .from("services")
                        .select("id, name_key, slug, description")
                        .eq("id", service.service_id)
                        .single();

                    if (!serviceError) {
                      serviceDetails = serviceData;
                    }
                  } catch (err) {
                    // Silent error handling
                  }

                  // Get prices
                  try {
                    const { data: priceData } = await supabase
                      .from("worker_service_prices")
                      .select("*")
                      .eq("worker_service_id", service.id);
                    prices = priceData || [];
                  } catch (err) {
                    // Silent error handling
                  }

                  return {
                    ...service,
                    services: serviceDetails,
                    worker_service_prices: prices,
                  };
                })
              );
            }
          } catch (err) {
            // Silent error handling
          }

          return {
            ...worker,
            user: userData,
            user_profiles: userProfile,
            worker_images: images,
            worker_services: servicesWithPrices,
          };
        } catch (error) {
          return {
            ...worker,
            user: null,
            user_profiles: null,
            worker_images: [],
            worker_services: [],
          };
        }
      })
    );

    return NextResponse.json({
      workers: workersWithDetails,
      total: workersWithDetails.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
