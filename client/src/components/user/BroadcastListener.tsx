import { useEffect, useRef, useState } from "react";
import { webSocket } from "@/lib/websocket";
import { AlertCircle, Volume2 } from "lucide-react";

interface BroadcastListenerProps {
  userId: number;
}

export default function BroadcastListener({ userId }: BroadcastListenerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReceivingBroadcast, setIsReceivingBroadcast] = useState(false);
  const [currentBroadcaster, setCurrentBroadcaster] = useState<string>("");
  // const [userInteracted, setUserInteracted] = useState<boolean>(false);

  // Append buffered audio chunks
  const appendToBuffer = (chunk: Uint8Array) => {
    const sourceBuffer = sourceBufferRef.current;
    const audio = audioRef.current;

    // Guard: don't append if MediaSource or audio is invalid
    if (
      !sourceBuffer ||
      !audio ||
      audio.error ||
      mediaSourceRef.current?.readyState !== "open"
    ) {
      console.log(audio,sourceBuffer,mediaSourceRef.current?.readyState,audio?.error);
      console.warn(
        "Cannot append: MediaSource is not ready or audio is in error state."
      );
      return;
    }

    // Queue if updating
    if (sourceBuffer.updating || queueRef.current.length > 0) {
      queueRef.current.push(chunk);
      return;
    }

    try {
      sourceBuffer.appendBuffer(chunk);
    } catch (error) {
      console.error("Failed to append buffer:", error);

      // Reset if media is in error state
      if (audio.error) {
        console.warn("Resetting audio due to media error...");
        resetAudio();
      }
    }
  };
  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src?.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    // Recreate MediaSource
    setupMediaSource();
  };
  const setupMediaSource = () => {
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    mediaSource.addEventListener("sourceopen", () => {
      try {
        const mimeCodec = "audio/webm; codecs=opus";

        if (!MediaSource.isTypeSupported(mimeCodec)) {
          console.error("Unsupported MIME type:", mimeCodec);
          return;
        }

        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener("updateend", () => {
          if (queueRef.current.length > 0 && !sourceBuffer.updating) {
            appendToBuffer(queueRef.current.shift()!);
          }
        });
      } catch (error) {
        console.error("Error creating SourceBuffer:", error);
      }
    });

    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(mediaSource);
      audioRef.current
        .play()
        .catch((err) => console.error("Playback error:", err));
    }
  };

  useEffect(() => {
    // Setup MediaSource
    const setupMediaSource = () => {
      console.log("Setting up MediaSource...");
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;

      mediaSource.addEventListener("sourceopen", () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer(
            "audio/webm; codecs=opus"
          );
          sourceBufferRef.current = sourceBuffer;

          sourceBuffer.addEventListener("updateend", () => {
            if (queueRef.current.length > 0 && !sourceBuffer.updating) {
              appendToBuffer(queueRef.current.shift()!);
            }
          });
        } catch (error) {
          console.error("Error creating SourceBuffer:", error);
        }
      });

      const audio = audioRef.current;
      if (audio) {
        audio.src = URL.createObjectURL(mediaSource);
        audio.play().catch((err) => console.error("Playback error:", err));
      }
    };

    // if(userInteracted){
      setupMediaSource();
    // }

    const initializeWebSocket = async () => {
      try {
        await webSocket.connect();
        webSocket.send({ type: "auth", userId });
        setIsConnected(true);
      } catch (err) {
        console.error("WebSocket error:", err);
        setIsConnected(false);
      }
    };

    initializeWebSocket();

    const interval = setInterval(() => {
      if (!webSocket.isConnected()) initializeWebSocket();
    }, 5000);

    const handleBroadcast = (data: any) => {
      if (
        (data.type === "broadcast" || data.type === "admin-broadcast") &&
        data.audio
      ) {
        if (data.userId === userId) return;

        setCurrentBroadcaster(data.adminName || "Admin");
        setIsReceivingBroadcast(true);
        setTimeout(() => setIsReceivingBroadcast(false), 4000);

        try {
          const base64Data = data.audio.replace(
            /^data:audio\/webm;codecs=opus;base64,/,
            ""
          );
          const byteArray = Uint8Array.from(atob(base64Data), (c) =>
            c.charCodeAt(0)
          );
          // if(userInteracted) {
            appendToBuffer(byteArray);
          // }
        } catch (error) {
          console.error("Failed to decode audio chunk:", error);
        }
      }
    };

    webSocket.onMessage(handleBroadcast);

    return () => {
      clearInterval(interval);
      webSocket.removeMessageListener(handleBroadcast);

      if (audioRef.current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [userId]);

  // function handleStartListening() {
  //   setUserInteracted(true);
  // }

  return (
    <div className="fixed bottom-14 md:bottom-4 right-2 md:right-4 p-1 md:p-2 rounded-lg bg-opacity-90 z-50 max-w-[90vw] md:max-w-md">
      <audio ref={audioRef} autoPlay hidden />
      {/* {!userInteracted && (
        <button
          onClick={()=>handleStartListening()}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
        >
          Start Listening
        </button>
      )} */}
      {isReceivingBroadcast && (
        <div className="flex items-center space-x-2 p-2 md:p-3 bg-[#1A1F2C] border border-[#0EA5E9] rounded-lg shadow-lg animate-pulse">
          <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-[#0EA5E9]" />
          <span className="text-white text-xs md:text-sm font-medium truncate">
            {currentBroadcaster} is speaking...
          </span>
        </div>
      )}
      {!isConnected && (
        <div className="flex items-center space-x-2 p-2 md:p-3 bg-[#1A1F2C] border border-yellow-500 rounded-lg shadow-lg">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
          <span className="text-white text-xs md:text-sm truncate">
            Connecting to broadcast service...
          </span>
        </div>
      )}
    </div>
  );
}
