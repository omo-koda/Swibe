def main() do
  println("Technosis Sovereign Demo — v1.0")
  trace("The organism has spoken.")
end# Agent: Oracle
name: "Oracle"
# Agent: Auditor
name: "Auditor"


# Run main
case Function.info(:main, 0) do
  [_ | _] -> main()
  nil -> :ok
end

