import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { PresignMediaInput, CompleteMediaInput } from '@orbitly/shared';

@Injectable()
export class MediaService {
  /**
   * Generates S3/MinIO upload coordinates and simulated/live presigned URL
   */
  async presignUpload(input: PresignMediaInput) {
    const timestamp = Date.now();
    const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `workspaces/${input.workspaceId}/${input.folder || 'root'}/${timestamp}_${sanitizedFilename}`;

    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const bucket = process.env.S3_BUCKET || 'orbitly-media';
    const publicUrl = `${endpoint}/${bucket}/${s3Key}`;
    const uploadUrl = `${endpoint}/${bucket}/${s3Key}?uploadToken=presigned_${timestamp}`;

    return {
      uploadUrl,
      publicUrl,
      s3Key,
      headers: {
        'Content-Type': input.mimeType,
      },
    };
  }

  /**
   * Completes upload and records media metadata in DB
   */
  async completeUpload(input: CompleteMediaInput) {
    return prisma.media.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        url: input.url,
        s3Key: input.s3Key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        duration: input.duration,
        altText: input.altText,
        folder: input.folder || 'root',
      },
    });
  }

  /**
   * List media library items
   */
  async listMedia(workspaceId: string, folder?: string) {
    return prisma.media.findMany({
      where: {
        workspaceId,
        folder: folder || undefined,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
