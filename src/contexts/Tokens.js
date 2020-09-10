import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import { useWeb3React } from '../hooks'
import {
  getTokenDecimals,
  getTokenExchangeAddressFromFactory,
  getTokenName,
  getTokenSymbol,
  isAddress,
  safeAccess
} from '../utils'

import { BigNumber } from 'ethers-utils'

export const NAME = 'name'
export const SYMBOL = 'symbol'
export const DECIMALS = 'decimals'
export const ADDRESS = 'address'
export const EXCHANGE_ADDRESS = 'exchangeAddress'
export const IS_M_TOKEN = 'isMToken'
export const MIN_ORDER = 'minOrder' // in the native currency
export const PRIMARY = 'primary'
export const PRIMARY_DECIMALS = 'primaryDecimals'
export const SECONDARY = 'secondary'
export const SECONDARY_DECIMALS = 'secondaryDecimals'

export const CURRENCY_A = 'currencyA'
export const CURRENCY_B = 'currencyB'

const UPDATE = 'UPDATE'

export const M_DAI_ADDRESS = '0x06301057d77d54b6e14c7faffb11ffc7cab4eaa7'
export const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
export const ETH_ADDRESS = 'ETH'
export const M_ETH_ADDRESS = '0xdf9307dff0a1b57660f60f9457d32027a55ca0b2'
export const DMG_ADDRESS = '0xEd91879919B71bB6905f23af0A68d231EcF87b14'
export const M_USDC_ADDRESS = '0x3564ad35b9e95340e5ace2d6251dbfc76098669b'
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const M_USDT_ADDRESS = '0x84d4afe150da7ea1165b9e45ff8ee4798d7c38da'
export const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

const _0 = new BigNumber(0)

export const ETH = {
  ETH: {
    [NAME]: 'Ethereum',
    [SYMBOL]: 'ETH',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null,
    [ADDRESS]: 'ETH',
  }
}

export const DELEGATE_ADDRESS = '0xE2466deB9536A69BF8131Ecd0c267EE41dd1cdA0'

export const INITIAL_TOKENS_CONTEXT = {
  1: {
    [DAI_ADDRESS]: {
      [NAME]: 'Dai Stablecoin',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x0000000000000000000000000000000000000000',
      [ADDRESS]: DAI_ADDRESS,
      [MIN_ORDER]: new BigNumber('100000000000000000000')
    },
    [USDC_ADDRESS]: {
      [NAME]: 'USD//C',
      [SYMBOL]: 'USDC',
      [DECIMALS]: 6,
      [EXCHANGE_ADDRESS]: '0x0000000000000000000000000000000000000000',
      [ADDRESS]: USDC_ADDRESS,
      [MIN_ORDER]: new BigNumber('100000000')
    },
    [WETH_ADDRESS]: {
      [NAME]: 'Wrapped Ether',
      [SYMBOL]: 'WETH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x0000000000000000000000000000000000000000',
      [ADDRESS]: WETH_ADDRESS,
      [MIN_ORDER]: new BigNumber('500000000000000000')
    },
    [DMG_ADDRESS]: {
      [NAME]: 'DMM Governance',
      [SYMBOL]: 'DMG',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x0000000000000000000000000000000000000000',
      [ADDRESS]: DMG_ADDRESS,
      [MIN_ORDER]: new BigNumber('80000000000000000000')
    }
  }
}

function initializeAllTokens() {
  const allTokens = JSON.parse(JSON.stringify(INITIAL_TOKENS_CONTEXT))

  // Add mTokens
  allTokens['1'][M_DAI_ADDRESS] = {
    [NAME]: 'DMM: DAI',
    [SYMBOL]: 'mDAI',
    [DECIMALS]: 18,
    [ADDRESS]: M_DAI_ADDRESS,
  }
  allTokens['1'][M_ETH_ADDRESS] = {
    [NAME]: 'DMM: ETH',
    [SYMBOL]: 'mETH',
    [DECIMALS]: 18,
    [ADDRESS]: M_ETH_ADDRESS,
  }
  allTokens['1'][M_USDC_ADDRESS] = {
    [NAME]: 'DMM: USDC',
    [SYMBOL]: 'mUSDC',
    [DECIMALS]: 6,
    [ADDRESS]: M_USDC_ADDRESS,
  }
  allTokens['1'][M_USDT_ADDRESS] = {
    [NAME]: 'DMM: USDT',
    [SYMBOL]: 'mUSDT',
    [DECIMALS]: 6,
    [ADDRESS]: M_USDT_ADDRESS,
  }

  // Add tokens not available for swapping
  allTokens['1'][ETH_ADDRESS] = ETH['ETH']
  allTokens['1'][USDT_ADDRESS] = {
    [NAME]: 'Tether USD',
    [SYMBOL]: 'USDT',
    [DECIMALS]: 6,
    [ADDRESS]: USDT_ADDRESS,
  }

  return allTokens
}

export const ALL_TOKENS_CONTEXT = initializeAllTokens()

export const MARKETS = {
  1: {
    [`${DMG_ADDRESS}-${DAI_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: DAI_ADDRESS,
      [PRIMARY_DECIMALS]: 2,
      [SECONDARY_DECIMALS]: 8
    },
    [`${DMG_ADDRESS}-${USDC_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: USDC_ADDRESS,
      [PRIMARY_DECIMALS]: 2,
      [SECONDARY_DECIMALS]: 6
    },
    [`${DMG_ADDRESS}-${WETH_ADDRESS}`]: {
      [PRIMARY]: DMG_ADDRESS,
      [SECONDARY]: WETH_ADDRESS,
      [PRIMARY_DECIMALS]: 1,
      [SECONDARY_DECIMALS]: 8
    }
  }
}

export const YIELD_FARMING_TOKENS = {
  1: {
    // [DMG_ADDRESS]: {
    //   [CURRENCY_A]: DMG_ADDRESS,
    //   [CURRENCY_B]: ETH_ADDRESS,
    //   [EXCHANGE_ADDRESS]: '0x8175362afbeee32afb22d05adc0bbd08de32f5ae',
    //   [IS_M_TOKEN]: false
    // },
    [M_DAI_ADDRESS]: {
      [CURRENCY_A]: M_DAI_ADDRESS,
      [CURRENCY_B]: DAI_ADDRESS,
      [EXCHANGE_ADDRESS]: '0x8da81afea7986698772a611bf37501236d443528',
      [IS_M_TOKEN]: true
    },
    [M_ETH_ADDRESS]: {
      [CURRENCY_A]: M_ETH_ADDRESS,
      [CURRENCY_B]: ETH_ADDRESS,
      [EXCHANGE_ADDRESS]: '0xa896f041a2b18e58e7fbc513cd371de1348596de',
      [IS_M_TOKEN]: true
    },
    [M_USDC_ADDRESS]: {
      [CURRENCY_A]: M_USDC_ADDRESS,
      [CURRENCY_B]: USDC_ADDRESS,
      [EXCHANGE_ADDRESS]: '0x78bda7a14d31c5c845e0b8e9e9e4b119e7691723',
      [IS_M_TOKEN]: true
    },
    [M_USDT_ADDRESS]: {
      [CURRENCY_A]: M_USDT_ADDRESS,
      [CURRENCY_B]: USDT_ADDRESS,
      [EXCHANGE_ADDRESS]: '0xf2482f09f54125a3659f788cf7436af0753d969f',
      [IS_M_TOKEN]: true
    }
  }
}

Object.keys(YIELD_FARMING_TOKENS).forEach((chainId => {
  Object.keys(YIELD_FARMING_TOKENS[chainId]).forEach(tokenAddress => {
    if (YIELD_FARMING_TOKENS[chainId][tokenAddress][IS_M_TOKEN]) {
      const underlyingAddress = YIELD_FARMING_TOKENS[chainId][tokenAddress][CURRENCY_B]
      YIELD_FARMING_TOKENS[chainId][underlyingAddress] = YIELD_FARMING_TOKENS[chainId][tokenAddress]
    }
  })
}))

const TokensContext = createContext()

const YieldFarmingTokensContext = createContext([YIELD_FARMING_TOKENS])

function useYieldFarmingTokensContext() {
  return useContext(YieldFarmingTokensContext)
}

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
            [EXCHANGE_ADDRESS]: exchangeAddress
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)

  const update = useCallback((networkId, tokenAddress, name, symbol, decimals, exchangeAddress) => {
    dispatch({ type: UPDATE, payload: { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { library, chainId } = useWeb3React()

  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress } =
  safeAccess(allTokensInNetwork, [tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false
      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)
      const exchangeAddressPromise = getTokenExchangeAddressFromFactory(tokenAddress, chainId, library).catch(
        () => null
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise, exchangeAddressPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress]) => {
          if (!stale) {
            update(chainId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress)
          }
        }
      )
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress, chainId, library, update])

  return { name, symbol, decimals, exchangeAddress }
}

export function useAllTokenDetails() {
  const { chainId } = useWeb3React()

  const [state] = useTokensContext()

  return useMemo(() => ({ ...ETH, ...(safeAccess(state, [chainId]) || {}) }), [state, chainId])
}

export function useAllYieldFarmingTokens() {
  const { chainId } = useWeb3React()

  const [state] = useYieldFarmingTokensContext()

  return useMemo(() => ({ ...(safeAccess(state, [chainId]) || {}) }), [state, chainId])
}
