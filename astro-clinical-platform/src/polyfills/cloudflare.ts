/**
 * Cloudflare Workers Polyfills
 * 為 Cloudflare Workers 環境提供必要的 polyfills
 */

// MessageChannel polyfill for React Server Components
if (typeof MessageChannel === 'undefined') {
  // @ts-ignore
  globalThis.MessageChannel = class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;

    constructor() {
      const channel = new (class {
        port1 = new MessagePort();
        port2 = new MessagePort();
        
        constructor() {
          // Connect the ports
          this.port1._otherPort = this.port2;
          this.port2._otherPort = this.port1;
        }
      })();
      
      this.port1 = channel.port1;
      this.port2 = channel.port2;
    }
  };

  // @ts-ignore
  globalThis.MessagePort = class MessagePort extends EventTarget {
    _otherPort?: MessagePort;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onmessageerror: ((event: MessageEvent) => void) | null = null;

    constructor() {
      super();
    }

    postMessage(message: any, transfer?: Transferable[]): void {
      // Simulate async message passing
      setTimeout(() => {
        if (this._otherPort) {
          const event = new MessageEvent('message', {
            data: message,
            ports: transfer as MessagePort[] || []
          });
          
          if (this._otherPort.onmessage) {
            this._otherPort.onmessage(event);
          }
          
          this._otherPort.dispatchEvent(event);
        }
      }, 0);
    }

    start(): void {
      // MessagePort.start() - no-op in this polyfill
    }

    close(): void {
      this._otherPort = undefined;
      this.onmessage = null;
      this.onmessageerror = null;
    }
  };
}

// MessageEvent polyfill if needed
if (typeof MessageEvent === 'undefined') {
  // @ts-ignore
  globalThis.MessageEvent = class MessageEvent extends Event {
    data: any;
    origin: string;
    lastEventId: string;
    source: MessageEventSource | null;
    ports: ReadonlyArray<MessagePort>;

    constructor(type: string, eventInitDict?: MessageEventInit) {
      super(type, eventInitDict);
      this.data = eventInitDict?.data;
      this.origin = eventInitDict?.origin || '';
      this.lastEventId = eventInitDict?.lastEventId || '';
      this.source = eventInitDict?.source || null;
      this.ports = eventInitDict?.ports || [];
    }
  };
}

// Additional polyfills for React Server Components
if (typeof queueMicrotask === 'undefined') {
  // @ts-ignore
  globalThis.queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback);
  };
}

// Performance polyfill for timing APIs
if (typeof performance === 'undefined') {
  // @ts-ignore
  globalThis.performance = {
    now(): number {
      return Date.now();
    },
    timeOrigin: Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntries: () => [],
    getEntriesByName: () => [],
    getEntriesByType: () => []
  };
}

export {};