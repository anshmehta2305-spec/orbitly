import { WebpageMetadata, formatDefaultCaption } from '../extractor';

export interface ExtensionState {
  apiKey: string;
  apiEndpoint: string;
  metadata?: WebpageMetadata;
  selectedChannels: string[];
}

export class OrbitlyPopupController {
  private state: ExtensionState = {
    apiKey: '',
    apiEndpoint: 'https://api.orbitly.io/public/v1',
    selectedChannels: ['twitter', 'linkedin'],
  };

  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    await this.fetchActiveTabMetadata();
  }

  private async loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const stored = await chrome.storage.sync.get(['orbitly_api_key', 'orbitly_endpoint']);
      if (stored.orbitly_api_key) this.state.apiKey = stored.orbitly_api_key;
      if (stored.orbitly_endpoint) this.state.apiEndpoint = stored.orbitly_endpoint;
    } else {
      this.state.apiKey = localStorage.getItem('orbitly_api_key') || 'orb_live_demo_123';
      this.state.apiEndpoint = localStorage.getItem('orbitly_endpoint') || 'https://api.orbitly.io/public/v1';
    }

    const keyInput = document.getElementById('api-key-input') as HTMLInputElement;
    const endpointInput = document.getElementById('api-endpoint-input') as HTMLInputElement;
    if (keyInput) keyInput.value = this.state.apiKey;
    if (endpointInput) endpointInput.value = this.state.apiEndpoint;
  }

  private async saveSettings(apiKey: string, endpoint: string) {
    this.state.apiKey = apiKey.trim();
    this.state.apiEndpoint = endpoint.trim();

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      await chrome.storage.sync.set({
        orbitly_api_key: this.state.apiKey,
        orbitly_endpoint: this.state.apiEndpoint,
      });
    } else {
      localStorage.setItem('orbitly_api_key', this.state.apiKey);
      localStorage.setItem('orbitly_endpoint', this.state.apiEndpoint);
    }
  }

  private setupEventListeners() {
    // Channel Pills Toggle
    const pills = document.querySelectorAll('.channel-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const chan = pill.getAttribute('data-channel');
        if (!chan) return;
        pill.classList.toggle('selected');
        if (pill.classList.contains('selected')) {
          if (!this.state.selectedChannels.includes(chan)) this.state.selectedChannels.push(chan);
        } else {
          this.state.selectedChannels = this.state.selectedChannels.filter((c) => c !== chan);
        }
      });
    });

    // Settings Toggle
    const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
    const settingsView = document.getElementById('settings-view');
    const composerView = document.getElementById('composer-view');

    toggleSettingsBtn?.addEventListener('click', () => {
      settingsView?.classList.toggle('active');
      composerView?.classList.toggle('hidden');
    });

    document.getElementById('cancel-settings-btn')?.addEventListener('click', () => {
      settingsView?.classList.remove('active');
      composerView?.classList.remove('hidden');
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
      const keyInput = document.getElementById('api-key-input') as HTMLInputElement;
      const endpointInput = document.getElementById('api-endpoint-input') as HTMLInputElement;
      await this.saveSettings(keyInput.value, endpointInput.value);
      settingsView?.classList.remove('active');
      composerView?.classList.remove('hidden');
      this.showStatus('Settings saved successfully', 'success');
    });

    // Publishing Action Buttons
    document.getElementById('schedule-btn')?.addEventListener('click', () => this.handlePublish('SCHEDULE'));
    document.getElementById('post-now-btn')?.addEventListener('click', () => this.handlePublish('NOW'));
    document.getElementById('draft-btn')?.addEventListener('click', () => this.handlePublish('DRAFT'));
  }

  private async fetchActiveTabMetadata() {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'GET_PAGE_METADATA' }, (response) => {
            if (response && response.success && response.metadata) {
              this.populatePreview(response.metadata);
            } else {
              // Fallback to tab title and URL
              this.populatePreview({
                title: activeTab.title || 'Untitled Webpage',
                canonicalUrl: activeTab.url || '',
                description: '',
              });
            }
          });
        }
      });
    } else {
      // Mock / Default preview for dev environment
      this.populatePreview({
        title: 'How to Build an AI-Driven Social Media Growth Engine in 2026',
        description: 'Explore state-of-the-art strategies for automated cross-platform distribution.',
        canonicalUrl: 'https://orbitly.io/blog/growth-engine-2026',
        ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      });
    }
  }

  populatePreview(meta: WebpageMetadata) {
    this.state.metadata = meta;

    const titleEl = document.getElementById('preview-title');
    const urlEl = document.getElementById('preview-url');
    const imgEl = document.getElementById('preview-image') as HTMLImageElement;
    const captionEl = document.getElementById('caption-input') as HTMLTextAreaElement;

    if (titleEl) titleEl.textContent = meta.title;
    if (urlEl) urlEl.textContent = meta.canonicalUrl ? new URL(meta.canonicalUrl).hostname : '';

    if (imgEl) {
      if (meta.ogImage) {
        imgEl.src = meta.ogImage;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }
    }

    if (captionEl && !captionEl.value) {
      captionEl.value = `Great read: ${meta.title}\n\n${meta.canonicalUrl}`;
    }
  }

  async handlePublish(mode: 'SCHEDULE' | 'NOW' | 'DRAFT') {
    const captionEl = document.getElementById('caption-input') as HTMLTextAreaElement;
    const content = captionEl?.value?.trim() || '';

    if (!content) {
      this.showStatus('Please write some content or thoughts.', 'error');
      return;
    }

    if (this.state.selectedChannels.length === 0) {
      this.showStatus('Please select at least one channel.', 'error');
      return;
    }

    const payload: any = {
      content,
      channelIds: this.state.selectedChannels,
      mediaUrls: this.state.metadata?.ogImage ? [this.state.metadata.ogImage] : [],
    };

    if (mode === 'SCHEDULE') {
      // Schedule 2 hours in the future
      payload.scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    } else if (mode === 'NOW') {
      payload.scheduledAt = new Date().toISOString();
    } // DRAFT omits scheduledAt

    try {
      this.showStatus('Connecting to Orbitly...', 'success');

      const endpoint = `${this.state.apiEndpoint}/posts`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.state.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `API error ${res.status}`);
      }

      this.showStatus(
        mode === 'SCHEDULE'
          ? '🎉 Post scheduled in Orbitly queue!'
          : mode === 'NOW'
            ? '🚀 Post submitted for publishing!'
            : '💾 Saved as draft in Orbitly!',
        'success',
      );

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.close) {
          window.close();
        }
      }, 1500);
    } catch (err: any) {
      this.showStatus(`Failed: ${err.message}`, 'error');
    }
  }

  private showStatus(msg: string, type: 'success' | 'error') {
    const statusEl = document.getElementById('status-msg');
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = `status-msg ${type}`;
    statusEl.style.display = 'block';
  }
}

// Instantiate in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new OrbitlyPopupController();
  });
}
