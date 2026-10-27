import React from 'react';
import {Composition} from 'remotion';
import {NOSWIPE_FPS, NOSWIPE_FRAMES, NoSwipeThumb} from './thumb/video';
import {AfterMidnight, BetweenSets, NextStop} from './receipt/episodes';
import {RECEIPT_FPS} from './receipt/receipt';
import {OVERTIME_FPS, OVERTIME_FRAMES, Overtime} from './receipt/overtime';
import {FRIDAY_FPS, FRIDAY_FRAMES, FridayNightLive} from './pregame/friday';
import {GC1_FPS, GC1_FRAMES, GroupChat1} from './stories/groupchat/ep1';

export const Root: React.FC = () => (
  <>
    <Composition id="Thumb" component={NoSwipeThumb} durationInFrames={NOSWIPE_FRAMES} fps={NOSWIPE_FPS} width={1080} height={1920} />
    <Composition id="AfterMidnight" component={AfterMidnight.Episode} durationInFrames={AfterMidnight.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="NextStop" component={NextStop.Episode} durationInFrames={NextStop.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="BetweenSets" component={BetweenSets.Episode} durationInFrames={BetweenSets.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="Overtime" component={Overtime} durationInFrames={OVERTIME_FRAMES} fps={OVERTIME_FPS} width={1080} height={1920} />
    <Composition id="GroupChat1" component={GroupChat1} durationInFrames={GC1_FRAMES} fps={GC1_FPS} width={1080} height={1920} />
    <Composition id="FridayNightLive" component={FridayNightLive} durationInFrames={FRIDAY_FRAMES} fps={FRIDAY_FPS} width={1080} height={1920} />
  </>
);
