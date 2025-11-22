/**
 * Worker Images API
 * POST   /api/worker/images - Add image to worker profile
 * DELETE /api/worker/images/[id] - Delete image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';
import { UploadImageRequest } from '@/lib/worker/types';

/**
 * POST /api/worker/images
 * Add image to worker profile
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UploadImageRequest = await request.json();

    // Validation
    if (!body.image_url || !body.image_type) {
      return NextResponse.json(
        { success: false, error: 'Image URL and type are required' },
        { status: 400 }
      );
    }

    const service = new WorkerProfileService(supabase);

    // Get worker profile
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Add image
    const image = await service.addWorkerImage(profile.id, {
      image_url: body.image_url,
      image_type: body.image_type,
      file_name: body.file_name,
      file_size_bytes: body.file_size_bytes,
      mime_type: body.mime_type,
      width_px: body.width_px,
      height_px: body.height_px,
    });

    return NextResponse.json({
      success: true,
      data: image,
      message: 'Image added successfully',
    });
  } catch (error: unknown) {

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to add image'),
      },
      { status: 500 }
    );
  }
}
