import React from 'react';
import {Composition} from 'remotion';
import {NOSWIPE_FPS, NOSWIPE_FRAMES, NoSwipeThumb} from './thumb/video';

export const Root: React.FC = () => (
  <>
    <Composition id="Thumb" component={NoSwipeThumb} durationInFrames={NOSWIPE_FRAMES} fps={NOSWIPE_FPS} width={1080} height={1920} />
  </>
);
