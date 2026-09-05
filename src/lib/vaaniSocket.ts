import {
  ConnectionStatus,
  ServerHandshake,
  ServerTelemetryMessage,
} from "./types";

export interface VaaniSocketCallbacks {
  onHandshake?: (data: ServerHandshake) => void;
  onTelemetry?: (data: ServerTelemetryMessage) => void;
  onEnhancedAudio?: (audio: Float32Array) => void;
  onError?: (errorMsg: string) => void;
  onClose?: () => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export class VaaniSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: VaaniSocketCallbacks;
  private sampleRate: number = 16000;
  private isHandshakeReceived: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(callbacks: VaaniSocketCallbacks = {}, wsUrl?: string) {
    this.callbacks = callbacks;
    if (wsUrl) {
      this.url = wsUrl;
    } else if (process.env.NEXT_PUBLIC_VAANI_WS_URL) {
      this.url = process.env.NEXT_PUBLIC_VAANI_WS_URL;
    } else {
      // Default to localhost:8000/ws/stream
      const isHttps =
        typeof window !== "undefined" && window.location.protocol === "https:";
      const protocol = isHttps ? "wss:" : "ws:";
      this.url = `${protocol}//localhost:8000/ws/stream`;
    }
  }

  public connect(sampleRate: number): Promise<ServerHandshake | void> {
    this.sampleRate = sampleRate;
    this.callbacks.onStatusChange?.("connecting");

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = "arraybuffer";
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create WebSocket connection";
        this.callbacks.onStatusChange?.("error");
        this.callbacks.onError?.(message);
        reject(new Error(message));
        return;
      }

      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          const timeoutErr = `Connection timed out to ${this.url}. Is the server running?`;
          this.callbacks.onStatusChange?.("error");
          this.callbacks.onError?.(timeoutErr);
          this.close();
          reject(new Error(timeoutErr));
        }
      }, 5000);

      this.ws.onopen = () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.callbacks.onStatusChange?.("connected");
      };

      this.ws.onmessage = (event: MessageEvent) => {
        // Handle incoming binary enhanced audio frame
        if (event.data instanceof ArrayBuffer) {
          const pcm16 = new Int16Array(event.data);
          const float32 = new Float32Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768.0;
          }
          this.callbacks.onEnhancedAudio?.(float32);
          return;
        }

        // Handle incoming JSON text message
        if (typeof event.data === "string") {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "handshake") {
              this.isHandshakeReceived = true;
              this.callbacks.onHandshake?.(data as ServerHandshake);
              // Send configuration matching AudioContext sample rate
              this.sendConfig(this.sampleRate);
              resolve(data as ServerHandshake);
            } else if (data.type === "telemetry") {
              this.callbacks.onTelemetry?.(data as ServerTelemetryMessage);
            } else if (data.type === "error") {
              this.callbacks.onError?.(data.message || "Server streaming error");
            }
          } catch {
            // Ignore non-JSON or malformed packets
          }
        }
      };

      this.ws.onerror = (event) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        const errorMsg = `WebSocket error connecting to ${this.url}. Check if the server is running on localhost:8000.`;
        this.callbacks.onStatusChange?.("error");
        this.callbacks.onError?.(errorMsg);
        reject(new Error(errorMsg));
      };

      this.ws.onclose = (event) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.callbacks.onStatusChange?.("disconnected");
        this.callbacks.onClose?.();
      };
    });
  }

  public sendConfig(sampleRate: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "config",
          sample_rate: sampleRate,
          format: "int16",
          attn_limit_db: null,
          normalize: false,
        })
      );
    }
  }

  public sendAudioChunk(pcm16Data: ArrayBufferView) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(pcm16Data.buffer);
    }
  }

  public sendFlush() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "flush" }));
      } catch {
        // Ignore send errors during shutdown
      }
    }
  }

  public close() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendFlush();
        this.ws.close();
      } else if (this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  public get isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
