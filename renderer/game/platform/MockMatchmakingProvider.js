import { MatchmakingProvider } from './MatchmakingProvider.js';
import { createMatchManifest } from '../simulation/MatchManifest.js';

export class MockMatchmakingProvider extends MatchmakingProvider {
  async createMatch({seed,playerName='PLAYER'}={}) { return createMatchManifest(seed || String(Date.now()),playerName); }
}
