"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type VideoInfo = {
  id: number;
  title: string;
  videoId: string;
};

type VideoPlayerContextType = {
  video: VideoInfo | null;
  play: (info: VideoInfo) => void;
  stop: () => void;
  /** 인라인 플레이어가 화면에 보이는 중인지 */
  inlineVisible: boolean;
  setInlineVisible: (v: boolean) => void;
};

const VideoPlayerContext = createContext<VideoPlayerContextType>({
  video: null,
  play: () => {},
  stop: () => {},
  inlineVisible: false,
  setInlineVisible: () => {},
});

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [inlineVisible, setInlineVisible] = useState(false);

  const play = useCallback((info: VideoInfo) => setVideo(info), []);
  const stop = useCallback(() => {
    setVideo(null);
    setInlineVisible(false);
  }, []);

  return (
    <VideoPlayerContext.Provider value={{ video, play, stop, inlineVisible, setInlineVisible }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  return useContext(VideoPlayerContext);
}
