/**
 * Swibe Plugin Interface
 * Base class for all Swibe extensions
 */

export class SwibePlugin {
  /**
   * Called after a new agent identity (keypair) is born
   */
  onBirth(_keypair) {}

  /**
   * Called after an LLM thought is generated
   */
  onThink(_prompt, _response) {}

  /**
   * Called after a cryptographic receipt is sealed
   */
  onReceipt(_receipt) {}

  /**
   * Called after a successful RAG save or final settlement
   */
  onSettle(_result) {}
}
