#!/bin/bash
if [ ! -f "swarm-fixed.swibe" ]; then
  echo "📝 Generating swarm-fixed.swibe..."
  cat > swarm-fixed.swibe << 'SWIBE_EOF'
ethics { harm_none: true; mode: "hermetic" }
birth { identity: "bipọn39" }
secure { execution: "strict-vm" }
budget { tokens: 10000; time: "600s" }
permission { think: "auto"; swarm: "consensus" }
swarm "Vanguard-Observer" {
  chain {
    think "phase 0: entropy seeding"
    think "phase 1: Omokoda correspondence"
    think "phase 2: Twelve Thrones registration"
    think "phase 3: synthesize codex"
  }
  evolve { soul: "Vanguard-Observer"; rank: 5 }
  heartbeat { every: "15s"; action: "health_check" }
  remember { key: "ancestral_vector"; tier: "long_term" }
}
remember { key: "ritual_state" }
wallet { token: "toc_s" }
think "Àṣẹ. Swarm protocol initiated."
SWIBE_EOF
fi
# Execute
echo "⚡ Launching swarm..."
node src/index.js run swarm-fixed.swibe
echo "✅ Swarm execution complete."
