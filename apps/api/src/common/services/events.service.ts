import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface PostEvent {
  type: string;
  workspaceId: string;
  postId: string;
  variantId?: string;
  channelId?: string;
  status?: string;
  data?: any;
  timestamp: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly eventSubject = new Subject<PostEvent>();

  /**
   * Broadcasts a post or variant event to all connected workspace listeners
   */
  emit(event: Omit<PostEvent, 'timestamp'>) {
    const fullEvent: PostEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.logger.debug(`[SSE Broadcast] ${fullEvent.type} for Post ${fullEvent.postId} in ${fullEvent.workspaceId}`);
    this.eventSubject.next(fullEvent);
  }

  /**
   * Helper to broadcast a generic event to a workspace
   */
  broadcastToWorkspace(workspaceId: string, payload: { type: string; data?: any }) {
    this.emit({
      type: payload.type,
      workspaceId,
      postId: payload.data?.postId || 'workspace',
      data: payload.data,
    });
  }

  /**
   * Returns an Observable stream filtered by workspaceId for SSE controllers
   */
  getEventStream(workspaceId: string): Observable<{ data: string }> {
    return this.eventSubject.asObservable().pipe(
      filter((e) => e.workspaceId === workspaceId),
      map((e) => ({
        data: JSON.stringify(e),
      })),
    );
  }
}
