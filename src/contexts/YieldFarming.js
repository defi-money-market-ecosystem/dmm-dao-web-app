import { useInterval } from '../hooks'
import { DMM_API_URL } from '../utils'
import { createContext, useMemo } from 'react'

export const YIELD_FARMING_ROUTER_ADDRESS = '0x8209eD0259F99Abd593E8cd26e6a14f224C6cccA'
export const YIELD_FARMING_PROXY_ADDRESS = '0x502e90e092Cd08e6630e8E1cE426fC6d8ADb3975'

const IS_FARMING_ACTIVE = 'isFarmingActive'

export function useIsYieldFarmingActive() {
  const state = createContext({ IS_FARMING_ACTIVE: false })

  useInterval(() => {
    fetch(`${DMM_API_URL}/v1/yield-farming/is-active`)
      .then(response => response.json())
      .then(response => {
        state[IS_FARMING_ACTIVE] = response?.data
      })
      .catch(error => {
        console.log('error ', error)
        state[IS_FARMING_ACTIVE] = false
      })
  }, 15 * 1000)

  return useMemo(() => state[IS_FARMING_ACTIVE], [state])
}