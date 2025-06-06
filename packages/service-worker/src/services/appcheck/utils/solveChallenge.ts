import { ChallengeSolver, ChallengeTypes } from '@core/types';
import solveBasicChallenge from './challenges/basic';
import solveReverseChallenge from './challenges/reverse';

type Params = {
  type: ChallengeTypes;
  challengeDetails: string;
};

const CHALLENGE_MAP: Record<ChallengeTypes, ChallengeSolver> = {
  [ChallengeTypes.BASIC]: solveBasicChallenge,
  [ChallengeTypes.REVERSE]: solveReverseChallenge,
};

const solveChallenge = async ({ type, challengeDetails }: Params) => {
  const solver = CHALLENGE_MAP[type];
  return solver(challengeDetails);
};

export default solveChallenge;
