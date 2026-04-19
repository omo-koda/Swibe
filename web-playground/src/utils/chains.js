/**
 * Multi-Chain configuration and utilities
 * Ethereum, Solana, Bitcoin, Sui, Cosmos, Aptos
 *
 * Each chain has an `rpcs` array (ordered by priority) for failover rotation.
 * The legacy `rpc` field points to the primary endpoint for backward compat.
 */

export const CHAINS = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    curve: 'secp256k1',
    hash: 'keccak256',
    addressLength: 42,
    prefix: '0x',
    icon: '⟠',
    bip44: "m/44'/60'/0'/0",
    rpcs: [
      'https://cloudflare-eth.com',
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com',
    ],
    explorerTx: 'https://etherscan.io/tx/',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    curve: 'ed25519',
    hash: 'sha256',
    addressLength: 44,
    prefix: '',
    icon: '◎',
    bip44: "m/44'/501'/0'/0'",
    rpcs: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-mainnet.rpc.extrnode.com',
    ],
    explorerTx: 'https://explorer.solana.com/tx/',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    curve: 'secp256k1',
    hash: 'sha256',
    addressLength: 34,
    prefix: '1',
    icon: '₿',
    bip44: "m/84'/0'/0'/0",
    rpcs: [
      'https://blockstream.info/api',
      'https://mempool.space/api',
    ],
    explorerTx: 'https://blockstream.info/tx/',
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    curve: 'ed25519',
    hash: 'blake2b',
    addressLength: 66,
    prefix: '0x',
    icon: '〰',
    bip44: "m/44'/784'/0'/0'",
    rpcs: [
      'https://fullnode.mainnet.sui.io',
      'https://sui-mainnet.nodeinfra.com',
    ],
    explorerTx: 'https://explorer.sui.io/txblock/',
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    symbol: 'ATOM',
    curve: 'secp256k1',
    hash: 'sha256',
    addressLength: 45,
    prefix: 'cosmos1',
    icon: '✦',
    bip44: "m/44'/118'/0'/0",
    rpcs: [
      'https://cosmos-rest.publicnode.com',
      'https://rest.cosmos.directory/cosmoshub',
    ],
    explorerTx: 'https://mintscan.io/cosmos/txs/',
  },
  aptos: {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    curve: 'ed25519',
    hash: 'sha3',
    addressLength: 66,
    prefix: '0x',
    icon: '⬟',
    bip44: "m/44'/637'/0'/0'",
    rpcs: [
      'https://fullnode.mainnet.aptoslabs.com',
      'https://aptos-mainnet.pontem.network',
    ],
    explorerTx: 'https://explorer.aptoslabs.com/txn/',
  },
}

// Backward compat: expose primary RPC as `rpc`
Object.values(CHAINS).forEach(chain => {
  chain.rpc = chain.rpcs[0]
})

export function getChain(chainId) {
  return CHAINS[chainId] || CHAINS.ethereum
}

export function getAllChains() {
  return Object.values(CHAINS)
}
