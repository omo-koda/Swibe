/**
 * Swibe Plugin Interface
 * Defines the standard contract for ecosystem integrations.
 * Swibe Core remains universal; Technosis or other ecosystems implement this.
 */

export class SwibePlugin {
  /**
   * Called when an agent is born (instantiated).
   * @param {Object} agent - The agent instance.
   */
  onBirth(agent) {}

  /**
   * Called on every 'think' primitive execution.
   * @param {string} prompt - The prompt being processed.
   */
  onThink(prompt) {}

  /**
   * Called after execution to seal the receipt.
   * @param {Object} receipt - The SHA-256 receipt and metadata.
   */
  onReceipt(receipt) {}

  /**
   * Called at the end of an execution cycle or 'settle' primitive.
   * @param {Object} result - The final result of the execution.
   */
  onSettle(result) {}
}
