import React, { useState } from 'react'
import { Send } from 'lucide-react'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your Vanity Address AI Assistant. I can help you:\n• Suggest optimal address patterns\n• Estimate time to find addresses\n• Optimize batch searches\n• Explain difficulty levels' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }])
    setInput('')
    setIsLoading(true)

    // AI Response (local logic - no API needed)
    const response = generateAIResponse(input)
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: response }])
      setIsLoading(false)
    }, 500)
  }

  const generateAIResponse = (userInput) => {
    const lower = userInput.toLowerCase()

    // Pattern suggestions
    if (lower.includes('pattern') || lower.includes('suggest')) {
      return `Popular vanity patterns:\n\n🎯 EASY (1-5 min):\n• DEAD - 1 in 4,096\n• FACE - 1 in 4,096\n• CAFE - 1 in 4,096\n\n⚡ MEDIUM (5-30 min):\n• DEADBEEF - 1 in 16,777,216\n• FACECAFE - 1 in 16,777,216\n\n🔥 HARD (30+ min):\n• DEADBEEFFACE - 1 in 68B combinations`
    }

    // Difficulty explanation
    if (lower.includes('difficult') || lower.includes('how long')) {
      return `⏱️ Time Estimates (at 10,000 addr/sec):\n\n4-char pattern (e.g., DEAD):\n  Avg: 3 minutes\n\n6-char pattern (e.g., CAFE00):\n  Avg: 50 minutes\n\n8-char pattern (e.g., DEADBEEF):\n  Avg: 5-30 hours\n\n💡 Tip: Start with 4-char patterns to learn the system!`
    }

    // Batch optimization
    if (lower.includes('batch') || lower.includes('multiple')) {
      return `✅ Batch Search Tips:\n\n1. Run 3-5 patterns simultaneously\n2. Start with easier patterns (4 chars)\n3. Queue harder patterns for overnight\n4. Monitor: Speed drops when CPU throttles\n\n💪 Recommended batch:\n  • BEEF (easy, 5 min)\n  • FACE (easy, 5 min)\n  • DEADBEEF (hard, queue overnight)`
    }

    // Security
    if (lower.includes('secure') || lower.includes('safety')) {
      return `🔒 Security Guarantees:\n\n✓ 100% client-side - no servers\n✓ Private keys never transmitted\n✓ AES-256-GCM encryption available\n✓ Can run completely offline\n✓ No analytics or telemetry\n\n⚠️ Best practices:\n• Use Export feature for cold storage\n• Back up seed phrases securely\n• Test with small amounts first`
    }

    // Default helpful response
    return `I can help you with:\n\n📊 Ask about:\n• "How long to find DEADBEEF?"\n• "Suggest an easy pattern"\n• "How to optimize batch searches"\n• "Security and backups"\n\n💡 Or describe what you want:\n• "Something lucky but quick"\n• "A batch of 5 addresses"\n• "Hardest pattern you can find"`
  }

  return (
    <div className="card h-96 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Assistant</h2>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-gray-50 dark:bg-gray-900 p-4 rounded">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-500">AI thinking...</div>}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about vanity addresses..."
          className="flex-1 px-4 py-2 border rounded dark:bg-gray-800"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
