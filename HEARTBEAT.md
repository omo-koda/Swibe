# Swibe Heartbeat Specification

## Overview
Heartbeat enables autonomous proactive scheduling.
An agent can check conditions and act without
waiting for user input.

## Syntax
```swibe
heartbeat { every: 60s; check: "condition" }
```

## Behavior
- Fires every N seconds
- Checks condition via think
- Acts if condition is met
- Sabbath aware — no firing on Saturday
- Budget aware — respects token limits

## Example
```swibe
fn main() {
  heartbeat { every: 300s; check: "any new tasks?" }
  ethics { harm-none }
  remember { "heartbeat-session" }
}
```

## OpenClaw Integration
The heartbeat primitive maps directly to
OpenClaw's proactive scheduling system.
setInterval() in generated agent.js.

## Sabbath Compliance
No heartbeat fires on Saturday UTC.
Day 6 = rest. No exceptions without
WhiteGate consensus (3-of-5 council).
