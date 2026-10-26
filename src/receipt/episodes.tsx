import {Spec, Timeline, makeReceiptEpisode} from './receipt';
import afterMidnightSpec from '../../specs/after-midnight.json';
import afterMidnightTl from './after-midnight.timeline.json';
import nextStopSpec from '../../specs/next-stop.json';
import nextStopTl from './next-stop.timeline.json';
import betweenSetsSpec from '../../specs/between-sets.json';
import betweenSetsTl from './between-sets.timeline.json';

// Receipt episodes: a spec (specs/<id>.json) plus its voice-driven timeline.
export const AfterMidnight = makeReceiptEpisode(afterMidnightSpec as unknown as Spec, afterMidnightTl as unknown as Timeline);
export const NextStop = makeReceiptEpisode(nextStopSpec as unknown as Spec, nextStopTl as unknown as Timeline);
export const BetweenSets = makeReceiptEpisode(betweenSetsSpec as unknown as Spec, betweenSetsTl as unknown as Timeline);
