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

    console.log("Fetching pending workers...");

    // Get worker profiles that are pending approval
    const { data: pendingWorkers, error } = await supabase
      .from("worker_profiles")
      .select("*")
      .eq("profile_status", "pending");

    if (error) {
      console.error("Get pending workers error:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending workers", details: error.message },
        { status: 500 }
      );
    }

    console.log(`Found ${pendingWorkers?.length || 0} pending workers`);

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
          console.log(`Processing worker ${worker.id}...`);

          // Get auth user data
          let userData = null;
          try {
            const { data, error: userError } =
              await supabase.auth.admin.getUserById(worker.user_id);
            if (!userError && data) {
              userData = data.user;
            } else if (userError) {
              console.error(`Error getting user ${worker.user_id}:`, userError);
            }
          } catch (err) {
            console.error(`Exception getting user ${worker.user_id}:`, err);
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
            console.error(`Error getting user profile ${worker.user_id}:`, err);
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
            console.error(`Error getting images for worker ${worker.id}:`, err);
          }

          // Get worker services
          let servicesWithPrices = [];
          try {
            const { data: services, error: servicesError } = await supabase
              .from("worker_services")
              .select("*")
              .eq("worker_profile_id", worker.id);

            if (servicesError) {
              console.error(`Error getting services:`, servicesError);
            } else if (services && services.length > 0) {
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

                    if (serviceError) {
                      console.error(
                        `Error getting service ${service.service_id}:`,
                        serviceError
                      );
                    } else {
                      serviceDetails = serviceData;
                    }
                  } catch (err) {
                    console.error(
                      `Exception getting service ${service.service_id}:`,
                      err
                    );
                  }

                  // Get prices
                  try {
                    const { data: priceData } = await supabase
                      .from("worker_service_prices")
                      .select("*")
                      .eq("worker_service_id", service.id);
                    prices = priceData || [];
                  } catch (err) {
                    console.error(
                      `Error getting prices for service ${service.id}:`,
                      err
                    );
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
            console.error(
              `Error getting services for worker ${worker.id}:`,
              err
            );
          }

          return {
            ...worker,
            user: userData,
            user_profiles: userProfile,
            worker_images: images,
            worker_services: servicesWithPrices,
          };
        } catch (error) {
          console.error(`Error processing worker ${worker.user_id}:`, error);
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

    console.log(`Returning ${workersWithDetails.length} workers with details`);

    return NextResponse.json({
      workers: workersWithDetails,
      total: workersWithDetails.length,
    });
  } catch (error) {
    console.error("API error:", error);
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
