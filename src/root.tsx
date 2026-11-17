import React from 'react';
import {Composition} from 'remotion';
import {NOSWIPE_FPS, NOSWIPE_FRAMES, NoSwipeThumb} from './thumb/video';
import {AfterMidnight, BetweenSets, NextStop} from './receipt/episodes';
import {RECEIPT_FPS} from './receipt/receipt';
import {OVERTIME_FPS, OVERTIME_FRAMES, Overtime} from './receipt/overtime';
import {FRIDAY_FPS, FRIDAY_FRAMES, FridayNightLive} from './pregame/friday';
import {GC1_FPS, GC1_FRAMES, GroupChat1} from './stories/groupchat/ep1';
import {Avatar} from './account/avatar';
import {RING1_FPS, RING1_FRAMES, Ring1} from './stories/ring/ep1';
import {RING2_FPS, RING2_FRAMES, Ring2} from './stories/ring/ep2';
import {RING3_FPS, RING3_FRAMES, Ring3} from './stories/ring/ep3';
import {GC2_FPS, GC2_FRAMES, GroupChat2} from './stories/groupchat/ep2';
import {SEAT14B_FPS, SEAT14B_FRAMES, Seat14B} from './safety/seat14b';
import {GC3_FPS, GC3_FRAMES, GroupChat3} from './stories/groupchat/ep3';
import {LANE1_FPS, LANE1_FRAMES, Lane1} from './stories/lane/ep1';
import {LANE2_FPS, LANE2_FRAMES, Lane2} from './stories/lane/ep2';
import {LANE3_FPS, LANE3_FRAMES, Lane3} from './stories/lane/ep3';
import {LANE4_FPS, LANE4_FRAMES, Lane4} from './stories/lane/ep4';
import {WHITES1_FPS, WHITES1_FRAMES, Whites1} from './stories/whites/ep1';
import {WHITES2_FPS, WHITES2_FRAMES, Whites2} from './stories/whites/ep2';
import {WHITES3_FPS, WHITES3_FRAMES, Whites3} from './stories/whites/ep3';
import {WHITES4_FPS, WHITES4_FRAMES, Whites4} from './stories/whites/ep4';
import {WHITES5_FPS, WHITES5_FRAMES, Whites5} from './stories/whites/ep5';
import {TABLE1_FPS, TABLE1_FRAMES, Table1} from './stories/table/ep1';
import {TABLE2_FPS, TABLE2_FRAMES, Table2} from './stories/table/ep2';
import {TABLE3_FPS, TABLE3_FRAMES, Table3} from './stories/table/ep3';
import {TABLE4_FPS, TABLE4_FRAMES, Table4} from './stories/table/ep4';
import {TABLE5_FPS, TABLE5_FRAMES, Table5} from './stories/table/ep5';
import {TABLE6_FPS, TABLE6_FRAMES, Table6} from './stories/table/ep6';
import {BAG1_FPS, BAG1_FRAMES, Bag1} from './stories/bag/ep1';
import {BAG2_FPS, BAG2_FRAMES, Bag2} from './stories/bag/ep2';
import {BAG3_FPS, BAG3_FRAMES, Bag3} from './stories/bag/ep3';
import {ACROSS1_FPS, ACROSS1_FRAMES, Across1} from './stories/across/ep1';
import {ACROSS2_FPS, ACROSS2_FRAMES, Across2} from './stories/across/ep2';
import {ACROSS3_FPS, ACROSS3_FRAMES, Across3} from './stories/across/ep3';
import {ACROSS4_FPS, ACROSS4_FRAMES, Across4} from './stories/across/ep4';
import {ACROSS5_FPS, ACROSS5_FRAMES, Across5} from './stories/across/ep5';
import {DRYER6_FPS, DRYER6_FRAMES, Dryer6} from './stories/dryer/ep6';
import {DRYER5_FPS, DRYER5_FRAMES, Dryer5} from './stories/dryer/ep5';
import {DRYER4_FPS, DRYER4_FRAMES, Dryer4} from './stories/dryer/ep4';
import {DRYER3_FPS, DRYER3_FRAMES, Dryer3} from './stories/dryer/ep3';
import {DRYER2_FPS, DRYER2_FRAMES, Dryer2} from './stories/dryer/ep2';
import {DRYER1_FPS, DRYER1_FRAMES, Dryer1} from './stories/dryer/ep1';
import {ALLEY1_FPS, ALLEY1_FRAMES, Alley1} from './stories/alley/ep1';
import {ALLEY2_FPS, ALLEY2_FRAMES, Alley2} from './stories/alley/ep2';
import {ALLEY3_FPS, ALLEY3_FRAMES, Alley3} from './stories/alley/ep3';
import {ALLEY4_FPS, ALLEY4_FRAMES, Alley4} from './stories/alley/ep4';
import {ALLEY5_FPS, ALLEY5_FRAMES, Alley5} from './stories/alley/ep5';
import {SWIPES1_FPS, SWIPES1_FRAMES, Swipes1} from './stories/swipes/ep1';
import {SWIPES2_FPS, swipes2Frames, Swipes2} from './stories/swipes/ep2';
import {ALLEY6_FPS, ALLEY6_FRAMES, Alley6} from './stories/alley/ep6';

export const Root: React.FC = () => (
  <>
    <Composition id="Swipes1" component={Swipes1} durationInFrames={SWIPES1_FRAMES} fps={SWIPES1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Swipes2" component={Swipes2} durationInFrames={swipes2Frames('b')} fps={SWIPES2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} calculateMetadata={({props}) => ({durationInFrames: swipes2Frames(props.hook as 'a' | 'b')})} />
    <Composition id="Lane1" component={Lane1} durationInFrames={LANE1_FRAMES} fps={LANE1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Lane2" component={Lane2} durationInFrames={LANE2_FRAMES} fps={LANE2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Lane3" component={Lane3} durationInFrames={LANE3_FRAMES} fps={LANE3_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Lane4" component={Lane4} durationInFrames={LANE4_FRAMES} fps={LANE4_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table1" component={Table1} durationInFrames={TABLE1_FRAMES} fps={TABLE1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table2" component={Table2} durationInFrames={TABLE2_FRAMES} fps={TABLE2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Whites1" component={Whites1} durationInFrames={WHITES1_FRAMES} fps={WHITES1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Whites2" component={Whites2} durationInFrames={WHITES2_FRAMES} fps={WHITES2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Whites3" component={Whites3} durationInFrames={WHITES3_FRAMES} fps={WHITES3_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Whites4" component={Whites4} durationInFrames={WHITES4_FRAMES} fps={WHITES4_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Whites5" component={Whites5} durationInFrames={WHITES5_FRAMES} fps={WHITES5_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table3" component={Table3} durationInFrames={TABLE3_FRAMES} fps={TABLE3_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table4" component={Table4} durationInFrames={TABLE4_FRAMES} fps={TABLE4_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table5" component={Table5} durationInFrames={TABLE5_FRAMES} fps={TABLE5_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Table6" component={Table6} durationInFrames={TABLE6_FRAMES} fps={TABLE6_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Bag1" component={Bag1} durationInFrames={BAG1_FRAMES} fps={BAG1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Bag2" component={Bag2} durationInFrames={BAG2_FRAMES} fps={BAG2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Bag3" component={Bag3} durationInFrames={BAG3_FRAMES} fps={BAG3_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Across1" component={Across1} durationInFrames={ACROSS1_FRAMES} fps={ACROSS1_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Across2" component={Across2} durationInFrames={ACROSS2_FRAMES} fps={ACROSS2_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Across3" component={Across3} durationInFrames={ACROSS3_FRAMES} fps={ACROSS3_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Across4" component={Across4} durationInFrames={ACROSS4_FRAMES} fps={ACROSS4_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Across5" component={Across5} durationInFrames={ACROSS5_FRAMES} fps={ACROSS5_FPS} width={1080} height={1920} defaultProps={{hook: 'a' as const}} />
    <Composition id="Dryer6" component={Dryer6} durationInFrames={DRYER6_FRAMES} fps={DRYER6_FPS} width={1080} height={1920} />
    <Composition id="Dryer5" component={Dryer5} durationInFrames={DRYER5_FRAMES} fps={DRYER5_FPS} width={1080} height={1920} />
    <Composition id="Dryer4" component={Dryer4} durationInFrames={DRYER4_FRAMES} fps={DRYER4_FPS} width={1080} height={1920} />
    <Composition id="Dryer3" component={Dryer3} durationInFrames={DRYER3_FRAMES} fps={DRYER3_FPS} width={1080} height={1920} />
    <Composition id="Dryer2" component={Dryer2} durationInFrames={DRYER2_FRAMES} fps={DRYER2_FPS} width={1080} height={1920} />
    <Composition id="Dryer1" component={Dryer1} durationInFrames={DRYER1_FRAMES} fps={DRYER1_FPS} width={1080} height={1920} />
    <Composition id="Alley6" component={Alley6} durationInFrames={ALLEY6_FRAMES} fps={ALLEY6_FPS} width={1080} height={1920} />
    <Composition id="Alley5" component={Alley5} durationInFrames={ALLEY5_FRAMES} fps={ALLEY5_FPS} width={1080} height={1920} />
    <Composition id="Alley4" component={Alley4} durationInFrames={ALLEY4_FRAMES} fps={ALLEY4_FPS} width={1080} height={1920} />
    <Composition id="Alley3" component={Alley3} durationInFrames={ALLEY3_FRAMES} fps={ALLEY3_FPS} width={1080} height={1920} />
    <Composition id="Alley2" component={Alley2} durationInFrames={ALLEY2_FRAMES} fps={ALLEY2_FPS} width={1080} height={1920} />
    <Composition id="Alley1" component={Alley1} durationInFrames={ALLEY1_FRAMES} fps={ALLEY1_FPS} width={1080} height={1920} />
    <Composition id="Thumb" component={NoSwipeThumb} durationInFrames={NOSWIPE_FRAMES} fps={NOSWIPE_FPS} width={1080} height={1920} />
    <Composition id="AfterMidnight" component={AfterMidnight.Episode} durationInFrames={AfterMidnight.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="NextStop" component={NextStop.Episode} durationInFrames={NextStop.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="BetweenSets" component={BetweenSets.Episode} durationInFrames={BetweenSets.frames} fps={RECEIPT_FPS} width={1080} height={1920} />
    <Composition id="Overtime" component={Overtime} durationInFrames={OVERTIME_FRAMES} fps={OVERTIME_FPS} width={1080} height={1920} />
    <Composition id="Ring3" component={Ring3} durationInFrames={RING3_FRAMES} fps={RING3_FPS} width={1080} height={1920} />
    <Composition id="Ring2" component={Ring2} durationInFrames={RING2_FRAMES} fps={RING2_FPS} width={1080} height={1920} />
    <Composition id="Ring1" component={Ring1} durationInFrames={RING1_FRAMES} fps={RING1_FPS} width={1080} height={1920} />
    <Composition id="TLSAvatar" component={Avatar} durationInFrames={1} fps={30} width={1080} height={1080} defaultProps={{v: 'bubble' as const}} />
    <Composition id="GroupChat3" component={GroupChat3} durationInFrames={GC3_FRAMES} fps={GC3_FPS} width={1080} height={1920} />
    <Composition id="GroupChat2" component={GroupChat2} durationInFrames={GC2_FRAMES} fps={GC2_FPS} width={1080} height={1920} />
    <Composition id="GroupChat1" component={GroupChat1} durationInFrames={GC1_FRAMES} fps={GC1_FPS} width={1080} height={1920} />
    <Composition id="Seat14B" component={Seat14B} durationInFrames={SEAT14B_FRAMES} fps={SEAT14B_FPS} width={1080} height={1920} />
    <Composition id="FridayNightLive" component={FridayNightLive} durationInFrames={FRIDAY_FRAMES} fps={FRIDAY_FPS} width={1080} height={1920} />
  </>
);
