import { NextResponse } from 'next/server';
import {
  requireUser,
  withErrorHandling,
  readJson,
} from '@/lib/auth-server';
import { cloudinaryDeleteSchema } from '@/lib/validation';
import { deleteAsset } from '@/lib/cloudinary';

// POST /api/admin/uploads/delete
//   Body: { publicId: string }
//
//   Deletes a Cloudinary asset by public_id. Typically called by
//   the admin UI right before/after replacing an image so the old
//   asset is cleaned up rather than orphaned in our Cloudinary folder.
//
//   Any authenticated admin can delete.
//
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { publicId } = cloudinaryDeleteSchema.parse(body);
  const result = await deleteAsset(publicId);
  return NextResponse.json({ result });
});
