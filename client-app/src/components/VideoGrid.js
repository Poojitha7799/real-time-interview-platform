import React, { memo } from 'react';

const VideoGrid = memo(({ 
  localVideoRef, 
  remoteVideoRef, 
  isInterviewer, 
  isAudioMuted, 
  isVideoActive, 
  toggleAudio, 
  toggleVideo 
}) => {
  // Existing layout rendering logic here...
});

VideoGrid.displayName = 'VideoGrid';
export default VideoGrid;