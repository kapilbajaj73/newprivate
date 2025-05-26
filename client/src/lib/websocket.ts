// Enhanced WebSocket client for WebRTC and push-to-talk broadcasting

type MessageListener = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds
  private messageListeners: MessageListener[] = [];
  private connected = false;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;

  constructor() {
    // Initialize empty
  }

  // Connect to the WebSocket server
  public async connect(): Promise<void> {
    if (this.connected) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<void>((resolve) => {
      this.connectResolve = resolve;
      
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Use explicit localhost for Mac M2 compatibility with Node.js v23+
      let host = window.location.host;
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        host = 'localhost:5000'; // Ensure we're using localhost explicitly
      }
      
      const wsUrl = `${protocol}//${host}/ws`;
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Resolve the connect promise
        if (this.connectResolve) {
          this.connectResolve();
          this.connectResolve = null;
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        this.connected = false;
        this.socket = null;
        this.connectPromise = null;
        
        // Reconnect after interval
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, this.reconnectInterval);
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Call all message listeners
          this.messageListeners.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in message listener:', error);
            }
          });
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    });

    return this.connectPromise;
  }
  
  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.connected = false;
    this.connectPromise = null;
    this.connectResolve = null;
  }
  
  // Send a message to the WebSocket server
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
      // Try to reconnect and send after connected
      this.connect().then(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify(data));
        }
      });
    }
  }
  
  // Add a message listener
  public onMessage(listener: MessageListener): void {
    this.messageListeners.push(listener);
  }

  // Add a one-time message listener for specific messages
  public addMessageListener(listener: MessageListener): void {
    this.messageListeners.push(listener);
  }

  // Remove a message listener
  public removeMessageListener(listener: MessageListener): void {
    const index = this.messageListeners.indexOf(listener);
    if (index !== -1) {
      this.messageListeners.splice(index, 1);
    }
  }
  
  // Check if connected to the WebSocket server
  public isConnected(): boolean {
    return this.connected;
  }
}

// Create singleton instance
export const webSocket = new WebSocketService();