
import React, { useEffect, useState } from "react";

/**
 * NOTE: This is a basic shell LiveKit video component.
 * You will want to add more UX and error handling logic as needed.
 * The LiveKit React SDK should be installed if not already available.
 */

interface LiveKitDebateVideoProps {
  roomName: string;
  userId: string;
  displayName?: string;
  isMuted?: boolean;
  isCameraEnabled?: boolean;
}

export const LiveKitDebateVideo: React.FC<LiveKitDebateVideoProps> = ({
  roomName,
  userId,
  displayName,
  isMuted,
  isCameraEnabled,
}) => {
  // You can expand this with actual LiveKit video call later.
  // For now it is a placeholder that solves the build error and hints what to do next.

  return (
    <div className="flex flex-col items-center justify-center h-full w-full rounded-2xl border-2 border-purple-600 bg-black/70">
      <div className="text-3xl text-purple-300 mb-4">🎥</div>
      <h2 className="text-lg font-bold text-white mb-2">
        LiveKit Video Call Here
      </h2>
      <p className="text-sm text-purple-200 mb-2">
        (room: <span className="underline">{roomName}</span>)
      </p>
      <div className="text-slate-400 text-xs">
        Video will auto-connect once LiveKit SDK integration is enabled.
      </div>
    </div>
  );
};
