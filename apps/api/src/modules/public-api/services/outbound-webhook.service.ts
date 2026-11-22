import { Injectable } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { signOutboundWebhook, isSafePublicUrl, decryptSecret } from '@orbitly/shared';

@Injectable()
export class OutboundWebhookService {
  async dispatchEvent(workspaceId: string, event: string, payload: any): Promise<void> {
    const webhooks = await prisma.outboundWebhook.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
        events: { has: event },
      },
    });

    for (const wh of webhooks) {
      this.deliverWebhook(wh, event, payload).catch((err) => {
        console.error(`[OutboundWebhook] ❌ Failed to dispatch ${event} to ${wh.url}:`, err.message);
      });
    }
  }

  async deliverWebhook(webhook: any, event: string, payload: any): Promise<any> {
    // SSRF Check
    const urlCheck = isSafePublicUrl(webhook.url);
    if (!urlCheck.safe) {
      await prisma.outboundWebhook.update({
        where: { id: webhook.id },
        data: { status: 'DISABLED' },
      });
      throw new Error(`SSRF Block: Webhook destination ${webhook.url} blocked: ${urlCheck.reason}`);
    }

    const rawPayload = JSON.stringify({
      id: `evt_out_${Date.now()}`,
      event,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    const secret = webhook.secret ? decryptSecret(webhook.secret) : 'sec_default_wh';
    const signed = signOutboundWebhook(rawPayload, secret);

    let status = 0;
    let body = '';
    let success = false;
    let error: string | null = null;

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Orbitly-Webhooks/1.0',
          'X-Orbitly-Signature': signed.signature,
          'X-Orbitly-Timestamp': String(signed.timestamp),
        },
        body: rawPayload,
      });

      status = res.status;
      body = (await res.text()).slice(0, 500);
      success = res.ok;
      if (!success) error = `HTTP ${status}`;
    } catch (err: any) {
      error = err.message;
    }

    // Record delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: JSON.parse(rawPayload),
        responseStatus: status,
        responseBody: body,
        deliveredAt: success ? new Date() : null,
        error,
      },
    });

    // Update webhook failure tracking
    if (success) {
      await prisma.outboundWebhook.update({
        where: { id: webhook.id },
        data: { failureCount: 0, lastDeliveryAt: new Date() },
      });
    } else {
      const newFailureCount = webhook.failureCount + 1;
      const statusUpdate = newFailureCount >= 10 ? 'DISABLED' : 'ACTIVE';
      await prisma.outboundWebhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: newFailureCount,
          status: statusUpdate,
        },
      });
    }

    return { success, status, error };
  }

  async redeliver(deliveryId: string): Promise<any> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });
    if (!delivery) throw new Error('Delivery not found');

    return this.deliverWebhook(delivery.webhook, delivery.event, delivery.payload);
  }
}
