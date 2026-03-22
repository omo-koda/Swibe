import { SwibePlugin } from '../src/plugin-interface.js';

export default class TestPlugin extends SwibePlugin {
  onBirth(keypair) {
    console.log(`[PLUGIN-HOOK] onBirth: PubKey born: ${keypair.pub.substring(0, 16)}...`);
  }

  onThink(prompt, response) {
    console.log(`[PLUGIN-HOOK] onThink: Prompt received, response generated.`);
  }

  onReceipt(receipt) {
    console.log(`[PLUGIN-HOOK] onReceipt: Receipt sealed: ${receipt.substring(0, 16)}...`);
  }

  onSettle(result) {
    console.log(`[PLUGIN-HOOK] onSettle: Settlement reached for key: ${result.key}`);
  }
}
