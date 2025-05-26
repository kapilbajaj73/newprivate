import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/authContext";
import ConferenceRoom from "@/components/conference/ConferenceRoom";
import BroadcastListener from "@/components/user/BroadcastListener";

export default function Conference() {
  const { user, loading } = useAuth();
  const [_, navigate] = useLocation();
  const { roomId } = useParams();

  // Check if user is logged in and has access to this room
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/");
      } else if (user.roomId !== parseInt(roomId || "0")) {
        // Redirect if the room doesn't match the user's assigned room
        navigate("/user");
      }
    }
  }, [user, loading, navigate, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0EA5E9]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-300">Loading conference room...</p>
        </div>
      </div>
    );
  }

  if (!user || user.roomId !== parseInt(roomId || "0")) {
    return null;
  }

  return (
    <>
      <ConferenceRoom />
      {user && <BroadcastListener userId={user.id} />}
    </>
  );
}
