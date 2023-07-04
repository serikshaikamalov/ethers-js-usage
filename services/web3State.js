export let chains = {
  '0x1': {
    chainId: 1,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    name: 'Ethereum Mainnet',
    blockExplorerUrls: ['https://etherscan.io'],
  },
  '0x3C': {
    chainId: '0x3C',
    chainName: 'GoChain',
    nativeCurrency: {
      name: 'GO',
      symbol: 'GO',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.gochain.io'],
    blockExplorerUrls: ['https://explorer.gochain.io'],
  },
  '0x89': {
    chainId: '0x89',
    rpcUrls: ['https://polygon-rpc.com'],
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  '0x13881': {
    chainId: '0x13881',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    chainName: 'Polygon Mumbai Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
}

/**
 * Web3 global state which stores actual account, network, currency info also used for notifying when the state is changed
 * chainId - in hex format
 * networkCurrency
 * account
 */
class Web3State extends EventTarget {
  constructor() {
    super()
    if (window.ethereum) {
      this.chainId = window.ethereum.chainId
      this.networkCurrency = chains[this.chainId]?.nativeCurrency.symbol
      this.account = window.ethereum.selectedAddress
    }
  }

  setChain(chainId) {
    this.chainId = chainId
    this.networkCurrency = chains[this.chainId].nativeCurrency.symbol

    this.dispatchEvent(
      new CustomEvent('updated', {
        detail: {
          chainId,
          account: this.account,
          networkCurrency: this.networkCurrency,
        },
      })
    )
  }

  setAccount(account) {
    this.account = account
    this.dispatchEvent(
      new CustomEvent('updated', {
        detail: {
          chainId: this.chainId,
          account,
          networkCurrency: this.networkCurrency,
        },
      })
    )
  }

  clear() {
    this.chainId = null
    this.account = null
    this.networkCurrency = null
  }
}

const web3State = new Web3State(chains)
export default web3State
