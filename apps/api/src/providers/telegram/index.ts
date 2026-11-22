import {
  SocialProvider,
  ConnectedAccount,
  NormalizedPostPayload,
  ProviderLimits,
  ProviderCapabilities,
} from '@orbitly/shared';
import {
  AuthExpiredError,
  RateLimitedError,
  ContentRejectedError,
  TransientError,
} from '@orbitly/shared';

export class TelegramProvider implements SocialProvider {
  public readonly id = 'telegram';
  public readonly name = 'Telegram';
  public readonly authType = 'token' as const;
  public readonly status = 'live' as const;

  public readonly capabilities: ProviderCapabilities = {
    text: true,
    images: true,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  };

  public readonly limits: ProviderLimits = {
    maxChars: 4096,
    maxImages: 10,
    maxVideoMb: 50,
  };

  async connectWithCredentials(input: {
    botToken: string;
    chatId: string;
  }): Promise<ConnectedAccount> {
    if (!input.botToken || !input.chatId) {
      throw new ContentRejectedError('Telegram Bot Token and Channel/Chat ID are required.');
    }

    const token = input.botToken.trim();
    const chatId = input.chatId.trim();

    try {
      // 1. Verify Bot Token validity
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        throw new AuthExpiredError(meData.description || 'Invalid Telegram Bot Token');
      }

      // 2. Verify Bot has access to target Channel/Chat
      const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
      const chatData = await chatRes.json();
      if (!chatData.ok) {
        throw new ContentRejectedError(
          `Bot cannot access chat (${chatId}): ${chatData.description}. Ensure bot is an administrator in the channel.`,
        );
      }

      const chat = chatData.result;
      const accountName = chat.title || (chat.username ? `@${chat.username}` : `Chat ${chat.id}`);

      return {
        accountId: String(chat.id),
        accountName,
        avatar: undefined,
        accessToken: `${token}:::${chatId}`, // compound secret
        metadata: {
          botUsername: meData.result.username,
          chatTitle: chat.title,
          chatUsername: chat.username,
          type: chat.type,
        },
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Failed connecting to Telegram API');
    }
  }

  async validate(account: ConnectedAccount): Promise<{ ok: boolean; reason?: string }> {
    const [token, chatId] = account.accessToken.split(':::');
    if (!token || !chatId) return { ok: false, reason: 'Invalid token structure' };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
      const data = await res.json();
      if (!data.ok) return { ok: false, reason: data.description };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: err.message };
    }
  }

  async publish(
    account: ConnectedAccount,
    payload: NormalizedPostPayload,
  ): Promise<{ externalId: string; url?: string }> {
    const [token, chatId] = account.accessToken.split(':::');

    try {
      let res: Response;
      const hasImage = payload.media && payload.media.length > 0;

      if (hasImage && payload.media?.[0]?.url) {
        // Send Photo
        res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: payload.media[0].url,
            caption: payload.text,
          }),
        });
      } else {
        // Send text message
        res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: payload.text,
          }),
        });
      }

      const data = await res.json();
      if (!data.ok) {
        if (data.error_code === 401) throw new AuthExpiredError(data.description);
        if (data.error_code === 429) throw new RateLimitedError(data.description);
        throw new ContentRejectedError(data.description || 'Failed to dispatch Telegram message');
      }

      const msgId = data.result.message_id;
      const username = account.metadata?.chatUsername;
      const url = username ? `https://t.me/${username}/${msgId}` : undefined;

      return {
        externalId: String(msgId),
        url,
      };
    } catch (err: any) {
      if (err.code) throw err;
      throw new TransientError(err.message || 'Telegram broadcast failed');
    }
  }

  async deletePost(account: ConnectedAccount, externalId: string): Promise<void> {
    const [token, chatId] = account.accessToken.split(':::');
    await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: Number(externalId),
      }),
    });
  }
}
