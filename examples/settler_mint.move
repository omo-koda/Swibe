module omokoda::soul {
  use sui::event;
  use sui::tx_context::{Self, TxContext};

  struct BreathEvent has copy, drop {
    message: vector<u8>,
    iteration: u64,
  }

  fun main() {
    mint
  }
}