import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ControlBarProps {
  onLeaveRoom: () => void;
}

export default function ControlBar({ onLeaveRoom }: ControlBarProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  const toggleParticipantsPanel = () => {
    setShowParticipants(!showParticipants);
  };

  const toggleChatPanel = () => {
    setShowChat(!showChat);
  };

  const handleShareScreen = () => {
    // This would integrate with Jitsi's screen sharing functionality
    console.log("Share screen clicked");
  };

  const handleLeaveClick = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    onLeaveRoom();
  };

  return (
    <>
      <div className="bg-[#1A1F2C] py-3 px-4 flex justify-between items-center border-t border-gray-800">
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${cameraEnabled ? 'bg-[#0EA5E9] text-white' : 'bg-[#2A3042] text-white'}`}
          onClick={toggleCamera}
          aria-label={cameraEnabled ? "Disable camera" : "Enable camera"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {cameraEnabled ? (
              <path d="M23 7l-7 5 7 5V7z M13 5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10z" />
            ) : (
              <>
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 .67L23 7v10l-6-4" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="default"
            size="icon"
            className="rounded-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
            onClick={handleShareScreen}
            aria-label="Share screen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </Button>

          <Button
            variant="default"
            size="icon"
            className={`rounded-full ${showParticipants ? 'bg-[#8B5CF6]' : 'bg-[#0EA5E9]'} hover:bg-[#0284C7] text-white`}
            onClick={toggleParticipantsPanel}
            aria-label="Participants"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </Button>

          <Button
            variant="default"
            size="icon"
            className={`rounded-full ${showChat ? 'bg-[#8B5CF6]' : 'bg-[#0EA5E9]'} hover:bg-[#0284C7] text-white`}
            onClick={toggleChatPanel}
            aria-label="Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Button>
        </div>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full"
          onClick={handleLeaveClick}
          aria-label="Leave conference"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </Button>
      </div>

      {/* Leave Conference Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="bg-[#2A3042] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Leave Conference</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to leave this conference?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLeave}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
