import React, { lazy, Suspense } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import Web3ReactManager from '../components/Web3ReactManager'
import Header from '../components/Header'
import Footer from '../components/Footer'

import NavigationTabs from '../components/NavigationTabs'
import { getAllQueryParams } from '../utils'
import Send from './Send'
import Vote from './Vote'
import ProposalDetailsPage from './Vote/ProposalDetailsPage'
import ProfilePage from './Vote/ProfilePage'
import { isAddress } from '../utils/index'
import Farm from './Farm/index'
import NFT from './NFT/index'

const Swap = lazy(() => import('./Swap'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  /*max-height: 100vh;
  height: 100%;*/
  background: linear-gradient(360deg, #327ccb, #4f94de 5%, #8bbbef 15%, #bdddff 25%, #deeeff 40%);
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`
const FooterWrapper = styled.div`
  width: 100%;
  min-height: 30px;
  align-self: flex-end;
  
  @media (max-width: 800px) {
    height: 50px;
    overflow: hidden;
  }
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  -webkit-box-align: center;
  z-index: 1;
  flex: 1 1 0%;
  overflow-y: visible;
  overflow-x: hidden;
  padding-bottom: 0;
  padding-top: 72px; 
`

const Body = styled.div`
  width: 100%;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;

  margin-top: 16px;
`

class App extends React.Component {

  render() {
    const params = getAllQueryParams()

    const key = 'REFERRAL_ADDRESS'
    const referrer = window.localStorage.getItem(key)
    if (params.referrer) {
      window.localStorage.setItem(key, params.referrer)
    } else {
      params.referrer = referrer
    }
    window.referrer = params.referrer

    return (
      <>
        <Suspense fallback={null}>
          <AppWrapper>
            <HeaderWrapper>
              <Header hideInfo hideBuy/>
            </HeaderWrapper>
            <BodyWrapper>
              <Body>
                <Web3ReactManager>
                  <BrowserRouter>
                    <NavigationTabs/>
                    { /*this Suspense is for route code-splitting*/ }
                    <Suspense fallback={null}>
                      <Switch>
                        <Route exact strict path="/swap" component={() => <Swap params={params}/>}/>
                        <Route
                          exact
                          strict
                          path="/swap/:tokenAddress?"
                          render={({ match, location }) => {
                            if (isAddress(match.params.tokenAddress)) {
                              return (
                                <Swap
                                  location={location}
                                  initialCurrency={isAddress(match.params.tokenAddress)}
                                  params={params}
                                />
                              )
                            } else {
                              return <Redirect to={{ pathname: '/swap' }} />
                            }
                          }}
                        />
                        <Route exact strict path="/burn" component={() => <Send params={params} />} />
                        <Route exact strict path="/governance/proposals" component={() => <Vote/>}/>
                        <Route exact strict path="/governance/proposals/:proposal_id" component={() => <ProposalDetailsPage/>}/>
                        <Route exact strict path="/governance/address/:wallet_address" component={() => <ProfilePage/>}/>
                        <Route exact strict path="/asset-introducers/purchase" component={() => <NFT params={params}/>}/>
                        <Redirect to="/swap"/>
                      </Switch>
                    </Suspense>
                  </BrowserRouter>
                </Web3ReactManager>
              </Body>
            </BodyWrapper>
            <FooterWrapper>
              <Footer/>
            </FooterWrapper>
          </AppWrapper>
        </Suspense>
      </>
    )
  }
}

export default App
