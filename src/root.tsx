import React from 'react';
import {Composition} from 'remotion';
import {NOSWIPE_FPS, NOSWIPE_FRAMES, NoSwipeThumb} from './thumb/video';
import {AfterMidnight, BetweenSets, NextStop} from './receipt/episodes';
import {RECEIPT_FPS} from './receipt/receipt';
import {OVERTIME_FPS, OVERTIME_FRAMES, Overtime} from './receipt/overtime';

export const Root: React.FC = () => (
  <>
    <Composition id="Thumb" component={NoSwipeThumb} durationInFrames={NOSWIPE_FRAMES} fps={NOSWIPE_FPS} width={1080} height={1920} />
    <Composition id="AfterMidnight" component={AfterMidnight.Episode} durationInFrames={AfterMidnight.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="NextStop" component={NextStop.Episode} durationInFrames={NextStop.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="BetweenSets" component={BetweenSets.Episode} durationInFrames={BetweenSets.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="Overtime" component={Overtime} durationInFrames={OVERTIME_FRAMES} fps={OVERTIME_FPS} width={1080} height={1920} />
  </>
);
