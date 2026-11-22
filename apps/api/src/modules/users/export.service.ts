import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@orbitly/db';

export interface GdprUserDataExport {
  exportDate: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    emailVerified: boolean;
  };
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: Date;
  }>;
  postsCreated: Array<{
    id: string;
    title: string | null;
    status: string;
    scheduledAt: Date | null;
    createdAt: Date;
    variants: Array<{
      channelId: string;
      content: string;
      status: string;
    }>;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
  legalNotice: string;
}

@Injectable()
export class GdprExportService {
  async exportUserData(userId: string): Promise<GdprUserDataExport> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Fetch posts authored by this user with variants
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        variants: {
          select: {
            channelId: true,
            content: true,
            status: true,
          },
        },
      },
    });

    // Fetch comments authored by this user
    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerified: Boolean(user.emailVerified),
      },
      workspaces: user.memberships.map((m) => ({
        id: m.workspaceId,
        name: m.workspace.name,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      postsCreated: posts,
      comments: comments,
      legalNotice: 'REVIEW WITH A LAWYER: Generated under GDPR Article 20 Right to Data Portability.',
    };
  }
}
