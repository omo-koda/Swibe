import React, { useState } from 'react'
import { calculateCreate2Address, calculateCreateAddress, getSampleBytecode } from '../utils/create2'

export default function Create2Calculator() {
  const [tab, setTab] = useState('create2')
  const [create2Form, setCreate2Form] = useState({
    deployer: '',
    salt: '',
    bytecode: getSampleBytecode(),
  })
  const [createForm, setCreateForm] = useState({
    deployer: '',
    nonce: '0',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCreate2 = () => {
    try {
      setError(null)
      const address = calculateCreate2Address(
        create2Form.deployer,
        create2Form.salt,
        create2Form.bytecode
      )
      setResult({ address, type: 'CREATE2' })
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCreate = () => {
    try {
      setError(null)
      const address = calculateCreateAddress(
        createForm.deployer,
        createForm.nonce
      )
      setResult({ address, type: 'CREATE' })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Contract Address Calculator</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('create2')}
          className={`pb-2 font-semibold transition-colors ${
            tab === 'create2'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          CREATE2 (Predictable)
        </button>
        <button
          onClick={() => setTab('create')}
          className={`pb-2 font-semibold transition-colors ${
            tab === 'create'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          CREATE (Traditional)
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}

      {/* CREATE2 Tab */}
      {tab === 'create2' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Predict contract addresses deployed with CREATE2. Formula: keccak256(0xff ++ deployer ++ salt ++ initCodeHash)
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Deployer Address</label>
            <input
              type="text"
              value={create2Form.deployer}
              onChange={(e) => setCreate2Form({ ...create2Form, deployer: e.target.value })}
              placeholder="0x..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Salt (32 bytes)</label>
            <input
              type="text"
              value={create2Form.salt}
              onChange={(e) => setCreate2Form({ ...create2Form, salt: e.target.value })}
              placeholder="0x... or hex string"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Init Bytecode</label>
            <textarea
              value={create2Form.bytecode}
              onChange={(e) => setCreate2Form({ ...create2Form, bytecode: e.target.value })}
              className="input h-24 font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Sample bytecode loaded: contract Empty {{}}
            </div>
          </div>

          <button
            onClick={handleCreate2}
            className="btn btn-primary w-full"
          >
            Calculate CREATE2 Address
          </button>
        </div>
      )}

      {/* CREATE Tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Predict contract addresses deployed with traditional CREATE. Formula: keccak256(rlp(deployer, nonce))
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Deployer Address</label>
            <input
              type="text"
              value={createForm.deployer}
              onChange={(e) => setCreateForm({ ...createForm, deployer: e.target.value })}
              placeholder="0x..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Nonce</label>
            <input
              type="number"
              value={createForm.nonce}
              onChange={(e) => setCreateForm({ ...createForm, nonce: e.target.value })}
              className="input"
              min="0"
            />
          </div>

          <button
            onClick={handleCreate}
            className="btn btn-primary w-full"
          >
            Calculate CREATE Address
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {result.type} Address:
          </div>
          <div className="font-mono text-lg text-green-700 dark:text-green-400 break-all">
            {result.address}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.address)}
            className="btn btn-secondary mt-3 w-full"
          >
            Copy Address
          </button>
        </div>
      )}
    </div>
  )
}
