import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core'
import { ethers } from 'ethers'

import { NetworkContextName } from './constants'
import { isMobile } from 'react-device-detect'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import BalancesContextProvider, { Updater as BalancesContextUpdater } from './contexts/Balances'
import YieldFarmingBalancesContextProvider, { Updater as YieldFarmingBalancesContextUpdater } from './contexts/YieldFarmingBalances'
import DmgRewardBalancesContextProvider, { Updater as DmgRewardBalancesContextUpdater } from './contexts/DmgRewardBalances'
import TokensContextProvider from './contexts/Tokens'
import AllowancesContextProvider from './contexts/Allowances'
import DolomiteOrderBooksContextProvider from './contexts/DolomiteOrderBooks'
import App from './pages/App'
import ThemeProvider, { GlobalStyle } from './theme'
import './i18n'
import * as ServiceWorker from './utils/register-service-worker'
import * as Sentry from '@sentry/browser';

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider)
  library.pollingInterval = 10000
  return library
}

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : window.web3 || window.ethereum ? 'mobileWeb3' : 'mobileRegular'
  })
  Sentry.init({
    dsn: "https://3cc535de51794ceba826f94ff3061521@o162178.ingest.sentry.io/5259601",
    release: process.env.REACT_APP_RELEASE_VERSION,
  })
} else {
  ReactGA.initialize('test', { testMode: true })
}

ReactGA.pageview(window.location.pathname + window.location.search)

ServiceWorker.register(() => {
  alert('A new updated is available. The page will refresh now.')
  window.location.reload()
})

function ContextProviders({ children }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TransactionContextProvider>
          <TokensContextProvider>
            <BalancesContextProvider>
              <AllowancesContextProvider>
                <YieldFarmingBalancesContextProvider>
                  <DmgRewardBalancesContextProvider>
                    <DolomiteOrderBooksContextProvider>{children}</DolomiteOrderBooksContextProvider>
                  </DmgRewardBalancesContextProvider>
                </YieldFarmingBalancesContextProvider>
              </AllowancesContextProvider>
            </BalancesContextProvider>
          </TokensContextProvider>
        </TransactionContextProvider>
      </ApplicationContextProvider>
    </LocalStorageContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
      <BalancesContextUpdater />
      <YieldFarmingBalancesContextUpdater />
      <DmgRewardBalancesContextUpdater />
    </>
  )
}

ReactDOM.render(
  <Web3ReactProvider getLibrary={getLibrary}>
    <Web3ProviderNetwork getLibrary={getLibrary}>
      <ContextProviders>
        <Updaters />
        <ThemeProvider>
          <>
            <GlobalStyle />
            <App />
          </>
        </ThemeProvider>
      </ContextProviders>
    </Web3ProviderNetwork>
  </Web3ReactProvider>,
  document.getElementById('root')
)
