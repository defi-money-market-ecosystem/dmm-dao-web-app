import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { ethers } from 'ethers'

import { useDebounce, useWeb3React } from '../hooks'
import { getDmgRewardBalance, getDmgRewardBalanceByToken, isAddress } from '../utils'
import { useBlockNumber } from './Application'
import { EXCHANGE_ADDRESS, useAllTokenDetails, useAllYieldFarmingTokens } from './Tokens'

const LOCAL_STORAGE_KEY = 'DMG_REWARD_BALANCES'

const SHORT_BLOCK_TIMEOUT = 1 // in seconds, represented as a block number delta
const LONG_BLOCK_TIMEOUT = (60 * 2) / 15 // in seconds, represented as a block number delta

interface DmgRewardBalancesState {
  [chainId: number]: {
    [address: string]: {
      [tokenAddress: string]: {
        value?: string | null
        blockNumber?: number
        listenerCount: number
      }
    }
  }
}

function initializeDmgRewardBalances(): DmgRewardBalancesState {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) as string)
  } catch {
    return {}
  }
}

enum Action {
  START_LISTENING,
  STOP_LISTENING,
  UPDATE,
  BATCH_UPDATE_ACCOUNT,
}

function reducer(state: DmgRewardBalancesState, { type, payload }: { type: Action; payload: any }) {
  switch (type) {
    case Action.START_LISTENING: {
      const { chainId, address, tokenAddress } = payload
      const uninitialized = !state?.[chainId]?.[address]?.[tokenAddress]
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: uninitialized
              ? {
                listenerCount: 1
              }
              : {
                ...state[chainId][address][tokenAddress],
                listenerCount: state[chainId][address][tokenAddress].listenerCount + 1
              }
          }
        }
      }
    }
    case Action.STOP_LISTENING: {
      const { chainId, address, tokenAddress } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: {
              ...state?.[chainId]?.[address]?.[tokenAddress],
              listenerCount: state[chainId][address][tokenAddress].listenerCount - 1
            }
          }
        }
      }
    }
    case Action.UPDATE: {
      const { chainId, address, tokenAddress, value, blockNumber } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            [tokenAddress]: {
              ...state?.[chainId]?.[address]?.[tokenAddress],
              value,
              blockNumber
            }
          }
        }
      }
    }
    case Action.BATCH_UPDATE_ACCOUNT: {
      const { chainId, address, tokenAddresses, values, blockNumber } = payload
      return {
        ...state,
        [chainId]: {
          ...state?.[chainId],
          [address]: {
            ...state?.[chainId]?.[address],
            ...tokenAddresses.reduce((accumulator: any, tokenAddress: string, i: number) => {
              const value = values[i]
              accumulator[tokenAddress] = {
                ...state?.[chainId]?.[address]?.[tokenAddress],
                value,
                blockNumber
              }
              return accumulator
            }, {})
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in DmgRewardBalancesContext reducer: '${type}'.`)
    }
  }
}

const DmgRewardBalancesContext = createContext<[DmgRewardBalancesState, { [k: string]: (...args: any) => void }]>([{}, {}])

function useDmgRewardBalancesContext() {
  return useContext(DmgRewardBalancesContext)
}

export default function Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initializeDmgRewardBalances)

  const startListening = useCallback((chainId, address, tokenAddress) => {
    dispatch({ type: Action.START_LISTENING, payload: { chainId, address, tokenAddress } })
  }, [])

  const stopListening = useCallback((chainId, address, tokenAddress) => {
    dispatch({ type: Action.STOP_LISTENING, payload: { chainId, address, tokenAddress } })
  }, [])

  const update = useCallback((chainId, address, tokenAddress, value, blockNumber) => {
    dispatch({ type: Action.UPDATE, payload: { chainId, address, tokenAddress, value, blockNumber } })
  }, [])

  const batchUpdateAccount = useCallback((chainId, address, tokenAddresses, values, blockNumber) => {
    dispatch({ type: Action.BATCH_UPDATE_ACCOUNT, payload: { chainId, address, tokenAddresses, values, blockNumber } })
  }, [])

  return (
    <DmgRewardBalancesContext.Provider
      value={useMemo(
        () => [state, { startListening, stopListening, update, batchUpdateAccount }],
        [state, startListening, stopListening, update, batchUpdateAccount]
      )}
    >
      {children}
    </DmgRewardBalancesContext.Provider>
  )
}

export function Updater() {
  const { chainId, account, library } = useWeb3React()
  const blockNumber = useBlockNumber()
  const [state, { update, batchUpdateAccount }] = useDmgRewardBalancesContext()

  const allTokens = useAllTokenDetails()
  const allYieldFarmingTokens = useAllYieldFarmingTokens()

  // debounce state a little bit to prevent useEffect craziness
  const debouncedState = useDebounce(state, 1000)
  // cache this debounced state in localstorage
  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(debouncedState))
  }, [debouncedState])

  // (slightly janky) balances-wide cache to prevent double/triple/etc. fetching
  const fetchedAsOfCache = useRef<{
    [chainId: number]: {
      [address: string]: {
        [tokenAddress: string]: number
      }
    }
  }>({})

  const fetchAggregateBalance = useCallback(
    (address: string) =>
      getDmgRewardBalance(address, library)
        .then(value => value.toString())
        .catch(() => null),
    [library]
  )

  useEffect(() => {
    if (typeof chainId === 'number' && typeof blockNumber === 'number') {
      for (const address of Object.keys(debouncedState?.[chainId] ?? {})) {
        const tokenAddress = ethers.constants.AddressZero
        const active = debouncedState[chainId][address][tokenAddress]?.listenerCount > 0
        if (active) {
          const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[address]?.[tokenAddress]
          const fetchedAsOf = debouncedState[chainId][address][tokenAddress]?.blockNumber ?? cachedFetchedAsOf
          if (fetchedAsOf !== blockNumber) {
            // fetch the balance...
            fetchAggregateBalance(address).then(value => {
              update(chainId, address, tokenAddress, value, blockNumber)
            })
            // ...and cache the fetch
            fetchedAsOfCache.current = {
              ...fetchedAsOfCache.current,
              [chainId]: {
                ...fetchedAsOfCache.current?.[chainId],
                [address]: {
                  ...fetchedAsOfCache.current?.[chainId]?.[address],
                  [tokenAddress]: blockNumber
                }
              }
            }
          }
        }

      }
    }
  }, [chainId, blockNumber, debouncedState, update, fetchAggregateBalance])

  // generic balances fetcher abstracting away difference between fetching ETH + token balances
  const fetchBalanceByToken = useCallback(
    (address: string, tokenAddress: string) =>
      getDmgRewardBalanceByToken(tokenAddress, address, library)
        .then(value => value.toString())
        .catch(() => null),
    [library]
  )

  // ensure that all balances with >=1 listeners are updated every block
  useEffect(() => {
    if (typeof chainId === 'number' && typeof blockNumber === 'number') {
      for (const address of Object.keys(debouncedState?.[chainId] ?? {})) {
        for (const tokenAddress of Object.keys(debouncedState?.[chainId][address])) {
          const active = debouncedState[chainId][address][tokenAddress].listenerCount > 0
          if (active) {
            const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[address]?.[tokenAddress]
            const fetchedAsOf = debouncedState[chainId][address][tokenAddress]?.blockNumber ?? cachedFetchedAsOf
            if (fetchedAsOf !== blockNumber) {
              // fetch the balance...
              fetchBalanceByToken(address, tokenAddress).then(value => {
                update(chainId, address, tokenAddress, value, blockNumber)
              })
              // ...and cache the fetch
              fetchedAsOfCache.current = {
                ...fetchedAsOfCache.current,
                [chainId]: {
                  ...fetchedAsOfCache.current?.[chainId],
                  [address]: {
                    ...fetchedAsOfCache.current?.[chainId]?.[address],
                    [tokenAddress]: blockNumber
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [chainId, blockNumber, debouncedState, fetchBalanceByToken, update])

  // get a state ref for batch updates
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // ensure that we have the user balances for all tokens
  useEffect(() => {
    if (typeof chainId === 'number' && typeof account === 'string' && typeof blockNumber === 'number') {
      const mappedYieldFarmingTokens = Object.keys(allYieldFarmingTokens)
        .map((key) => allTokens[allYieldFarmingTokens[key][EXCHANGE_ADDRESS]], {})
      // mappedYieldFarmingTokens = Object.keys(allYieldFarmingTokens).map(key => allYieldFarmingTokens[key])
      Promise.all(
        mappedYieldFarmingTokens
          .filter((tokenAddress: any) => {
            const hasValue = !!stateRef.current?.[chainId]?.[account]?.[tokenAddress]?.value
            const cachedFetchedAsOf = fetchedAsOfCache.current?.[chainId]?.[account]?.[tokenAddress]
            const fetchedAsOf = stateRef.current?.[chainId]?.[account]?.[tokenAddress]?.blockNumber ?? cachedFetchedAsOf

            // If there's no value, and it's not being fetched, we need to fetch!
            if (!hasValue && typeof cachedFetchedAsOf !== 'number') {
              return true
              // else, if there's a value, check if it's stale
            } else if (hasValue) {
              const blocksElapsedSinceLastCheck = blockNumber - fetchedAsOf
              const timeout = (stateRef.current[chainId][account][tokenAddress].value === '0'
                ? LONG_BLOCK_TIMEOUT
                : SHORT_BLOCK_TIMEOUT)

              return blocksElapsedSinceLastCheck >= timeout
            } else {
              return false
            }
          })
          .map(async (tokenAddress: any) => {
            fetchedAsOfCache.current = {
              ...fetchedAsOfCache.current,
              [chainId]: {
                ...fetchedAsOfCache.current?.[chainId],
                [account]: {
                  ...fetchedAsOfCache.current?.[chainId]?.[account],
                  [tokenAddress]: blockNumber
                }
              }
            }
            return fetchBalanceByToken(account, tokenAddress).then(value => ({ tokenAddress, value }))
          })
      ).then((results: any[]) => {
        batchUpdateAccount(
          chainId,
          account,
          results.map(result => result.tokenAddress),
          results.map(result => result.value),
          blockNumber
        )
      })
    }
  }, [chainId, account, blockNumber, allTokens, fetchBalanceByToken, batchUpdateAccount])


  return null
}

export function useAllDmgRewardBalances(address: string) {
  const { chainId } = useWeb3React()
  const [state, { startListening, stopListening }] = useDmgRewardBalancesContext()
  const tokenAddress = ethers.constants.AddressZero

  useEffect(() => {
    if (typeof chainId === 'number' && isAddress(address) && isAddress(tokenAddress)) {
      startListening(chainId, address, tokenAddress)
      return () => {
        stopListening(chainId, address, tokenAddress)
      }
    }
  }, [chainId, address, tokenAddress, startListening, stopListening])

  const value = typeof chainId === 'number' ? state?.[chainId]?.[address]?.[tokenAddress]?.value : undefined

  return useMemo(() => (typeof value === 'string' ? ethers.BigNumber.from(value) : value), [value])
}

export function useAddressDmgRewardBalance(address: string, tokenAddress: string): ethers.BigNumber | undefined | null {
  const { chainId } = useWeb3React()
  const [state, { startListening, stopListening }] = useDmgRewardBalancesContext()

  useEffect(() => {
    if (typeof chainId === 'number' && isAddress(address) && isAddress(tokenAddress)) {
      startListening(chainId, address, tokenAddress)
      return () => {
        stopListening(chainId, address, tokenAddress)
      }
    }
  }, [chainId, address, tokenAddress, startListening, stopListening])

  const value = typeof chainId === 'number' ? state?.[chainId]?.[address]?.[tokenAddress]?.value : undefined

  return useMemo(() => (typeof value === 'string' ? ethers.BigNumber.from(value) : value), [value])
}