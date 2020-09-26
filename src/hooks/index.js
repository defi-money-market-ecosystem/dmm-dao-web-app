import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import copy from 'copy-to-clipboard'
import { isMobile } from 'react-device-detect'

import { NetworkContextName } from '../constants'
import DMG_ABI from '../constants/abis/dmg'
import ERC20_ABI from '../constants/abis/erc20'
import WETH_ABI from '../constants/abis/weth'
import GOVERNOR_ALPHA_ABI from '../constants/abis/governor_alpha'
import YIELD_FARMING_PROXY from '../constants/abis/yield_farming_proxy'
import YIELD_FARMING_ROUTER from '../constants/abis/yield_farming_router'
import { getContract, getExchangeContract, getFactoryContract, isAddress } from '../utils'
import { injected } from '../connectors'
import { DMG_ADDRESS, WETH_ADDRESS } from '../contexts/Tokens'
import { GOVERNOR_ALPHA_ADDRESS } from '../contexts/GovernorAlpha'

export function useWeb3React() {
  const context = useWeb3ReactCore()
  const contextNetwork = useWeb3ReactCore(NetworkContextName)

  return context.active ? context : contextNetwork
}

export function useEagerConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        if (isMobile && window.ethereum) {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        } else {
          setTried(true)
        }
      }
    })
  }, [activate]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { active, error, activate } = useWeb3ReactCore() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleChainChanged = () => {
        // eat errors
        activate(injected, undefined, true).catch(() => {
        })
      }

      const handleAccountsChanged = accounts => {
        if (accounts.length > 0) {
          // eat errors
          activate(injected, undefined, true).catch(() => {
          })
        }
      }

      const handleNetworkChanged = () => {
        // eat errors
        activate(injected, undefined, true).catch(() => {
        })
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('networkChanged', handleNetworkChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('networkChanged', handleNetworkChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }

    return () => {
    }
  }, [active, error, suppress, activate])
}

// modified from https://usehooks.com/useDebounce/
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// modified from https://usehooks.com/useKeyPress/
export function useBodyKeyDown(targetKey, onKeyDown, suppressOnKeyDown = false) {
  const downHandler = useCallback(
    event => {
      const {
        target: { tagName },
        key
      } = event
      if (key === targetKey && tagName === 'BODY' && !suppressOnKeyDown) {
        event.preventDefault()
        onKeyDown()
      }
    },
    [targetKey, onKeyDown, suppressOnKeyDown]
  )

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [downHandler])
}

export function useENSName(address) {
  const { library } = useWeb3React()

  const [ENSName, setENSName] = useState()

  useEffect(() => {
    if (isAddress(address)) {
      let stale = false
      library
        .lookupAddress(address)
        .then(name => {
          if (!stale) {
            if (name) {
              setENSName(name)
            } else {
              setENSName(null)
            }
          }
        })
        .catch(() => {
          if (!stale) {
            setENSName(null)
          }
        })

      return () => {
        stale = true
        setENSName()
      }
    }
  }, [library, address])

  return ENSName
}

// returns null on errors
export function useContract(address, ABI, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getContract(address, ABI, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

// returns null on errors
export function useTokenContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      const abi = tokenAddress === WETH_ADDRESS ? WETH_ABI : ERC20_ABI
      return getContract(tokenAddress, abi, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [tokenAddress, library, withSignerIfPossible, account])
}

// returns null on errors
export function useDmgContract(withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      const abi = DMG_ABI
      return getContract(DMG_ADDRESS, abi, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [library, withSignerIfPossible, account])
}

// returns null on errors
export function useGovernorContract(withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      const abi = GOVERNOR_ALPHA_ABI
      return getContract(GOVERNOR_ALPHA_ADDRESS, abi, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [library, withSignerIfPossible, account])
}

// returns null on errors
export function useFactoryContract(withSignerIfPossible = true) {
  const { chainId, library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getFactoryContract(chainId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [chainId, library, withSignerIfPossible, account])
}

export function useExchangeContract(exchangeAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getExchangeContract(exchangeAddress, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [exchangeAddress, library, withSignerIfPossible, account])
}

export function useYieldFarmingRouterContract(yieldFarmingRouterAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getContract(yieldFarmingRouterAddress, YIELD_FARMING_ROUTER, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [yieldFarmingRouterAddress, library, withSignerIfPossible, account])
}

export function useYieldFarmingProxyContract(yieldFarmingProxyAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3React()

  return useMemo(() => {
    try {
      return getContract(yieldFarmingProxyAddress, YIELD_FARMING_PROXY, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [yieldFarmingProxyAddress, library, withSignerIfPossible, account])
}

export function useCopyClipboard(timeout = 500) {
  const [isCopied, setIsCopied] = useState(false)

  const staticCopy = useCallback(text => {
    const didCopy = copy(text)
    setIsCopied(didCopy)
  }, [])

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
  }, [isCopied, setIsCopied, timeout])

  return [isCopied, staticCopy]
}

// modified from https://usehooks.com/usePrevious/
export function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef()

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

export function useInterval(callback, tickDuration, executeImmediately, extraDeps) {
  const savedCallback = useRef()
  const savedExecuteImmediately = useRef(executeImmediately)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }

    if (executeImmediately) {
      savedCallback.current()
      savedExecuteImmediately.current = false
    }

    if (tickDuration !== null) {
      let id = setInterval(tick, tickDuration)
      return () => clearInterval(id)
    }
  }, [tickDuration, executeImmediately, ...(!!extraDeps ? extraDeps : [])])
}
