import { useWeb3React } from '../hooks'
import { DMM_API_URL } from '../utils'
import { useCallback, useEffect, useState } from 'react'

export const YIELD_FARMING_ROUTER_ADDRESS = '0x8209eD0259F99Abd593E8cd26e6a14f224C6cccA'
export const YIELD_FARMING_PROXY_ADDRESS = '0x502e90e092Cd08e6630e8E1cE426fC6d8ADb3975'

export function useIsYieldFarmingActive() {
  const [isFarmingActive, setIsFarmingActive] = useState(false)

  const { library } = useWeb3React()

  const fetchIsFarmingActive = useCallback(() => {
    fetch(`${DMM_API_URL}/v1/yield-farming/is-active`)
      .then(response => response.json())
      .then(response => setIsFarmingActive(response?.data))
      .catch(error => {
        console.log('error ', error)
        setIsFarmingActive(false)
      })
  }, [])

  useEffect(() => {
    fetchIsFarmingActive()
    library.on('block', fetchIsFarmingActive)

    return () => {
      library.removeListener('block', fetchIsFarmingActive)
    }
  }, [fetchIsFarmingActive, library])

  return isFarmingActive
}