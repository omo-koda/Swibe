module omokoda::soul {
  use sui::event;
  use sui::tx_context::{Self, TxContext};

  struct BreathEvent has copy, drop {
    message: vector<u8>,
    iteration: u64,
  }

  fun main() {
    // [MOVE-GEN] Unhandled: FunctionCall
    public entry fun swarm_execute(ctx: &mut TxContext) {
    let iter = 1;
    event::emit(BreathEvent { message: b"Thinker", iteration: iter });
    event::emit(BreathEvent { message: b"Settler", iteration: iter });
  }
    // [MOVE-GEN] Unhandled: FunctionCall
  }
}