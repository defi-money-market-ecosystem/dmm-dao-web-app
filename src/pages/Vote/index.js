import React, { useEffect, useState } from 'react'
import ProposalItem from './ProposalItem'
import styled from 'styled-components'
import { Link, useHistory } from 'react-router-dom'
import LeftArrow from '../../assets/svg/keyboard_arrow_left-black-18dp.svg'
import RightArrow from '../../assets/svg/keyboard_arrow_right-black-18dp.svg'
import { ProposalSummary } from '../../models/ProposalSummary'
import { useDmgContract, useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import BN from 'bn.js'
import Web3 from 'web3'
import { DMG_ADDRESS } from '../../contexts/Tokens'
import { amountFormatter, calculateGasMargin, DMM_API_URL, shorten } from '../../utils'
import { ethers } from 'ethers'
import * as Sentry from '@sentry/browser'
import { usePendingDelegation, useTransactionAdder } from '../../contexts/Transactions'
import CircularProgress from '@material-ui/core/CircularProgress'
import { AccountDetails } from '../../models/AccountDetails'
import { primaryColor } from '../../theme/index'
import { Button } from '../../theme'

import { withTranslations } from '../../services/Translations/Translations';

const Main = styled.div`
  width: 80vw;
  /*position: absolute;*/
  top: 156px;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  overflow-y: visible;
  overflow-x: hidden;
  font-family: "Open Sans", sans-serif;

  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  ::-webkit-scrollbar { /* Hide scrollbar for Chrome, Safari and Opera */
    display: none;
  }

  @media (max-width: 1000px) {
    top: 140px;
  }

  @media (max-width: 800px) {
    width: 100vw;
  }
`

const Votes = styled.div`
  text-align: center;
  height: 100px;
  color: #0a2a5a;
  font-weight: 600;
  font-family: Lato, sans-serif;

  @media (max-width: 1000px) {
    height: 70px;
  }
`
const VoteTitle = styled.div`
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.8px;
`
const Amount = styled.div`
  font-size: 48px;
  font-weight: 600;
  letter-spacing: 1px;
`
const Voting = styled.div`
  height: calc(100% - 100px);
  width: 100%;
`

const VotingWallet = styled.div`
  background-color: #FFFFFF;
  width: calc(35% - 20px);
  border-radius: 5px;
  margin: 10px;
  margin-bottom: 16px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;

  @media (max-width: 900px) {
    width: calc(100% - 20px);
  }
`

const GovernanceProposals = styled.div`
  width: calc(65% - 20px);;
  margin: 10px;
  margin-bottom: 1rem;
  color: black;
  display: inline-block;
  vertical-align: top;

  @media (max-width: 900px) {
    width: calc(100% - 20px);
  }
`

const GovernanceInner = styled.div`
  background-color: #FFFFFF;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  border-radius: 5px;
`

const Title = styled.div`
  font-size: 28px;
  font-weight: 300;
  color: #0a2a5a;
  padding: 20px 0 10px;
  margin: 0 30px;
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const Proposals = styled.div`
  height: calc(100% - 62px);
`

const WalletRow = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid #DCDCDC;
  
  ${({ flex }) => flex && `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-evenly;
    align-items: center;
  `}
`

const DMGTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  ${({ active }) => active ? `
    color: black;
  ` : `
    color: #b7c3cc;
  `}
`

const DelegationWrapper = styled.div`
  padding-top: 12px;
  display: inline-block;
`

const ViewProfileButtonWrapper = styled.div `
  @media (max-width: 700px) {
    text-align: center;
  }
`

const PurchaseAssetIntroducerNFTButtonWrapper = styled.div `
  @media (max-width: 700px) {
    text-align: center;
  }
`

const regularLink = {
  textDecoration: 'none',
  color: `${primaryColor}`,
  cursor: 'pointer',
}

const walletButtonStyle = {
  width: 225,
}

const purchaseAssetIntroducerSlotStyle = {
  width: 225,
}

const Value = styled.div`
  margin-top: 10px;
  font-size: 20px;
  font-weight: 500;
  color: #b7c3cc;
  display: inline;

  ${({ active }) => active && `
    color: black;
  `}

`

const ActivateWallet = styled.div`
  font-size: 18px;
  font-weight: 700;
  display: inline;
  cursor: pointer
  color: #000;
  float: right;

  ${({ hidden }) => hidden && `
    display: none;    
  `}
`

const Delegation = styled.div`
  font-size: 12px;
  border-radius: 3px;
  font-weight: 700;
  background-color: #327ccb;
  max-width: 100px;
  color: white;
  margin: auto;
  padding: 8px;
  cursor: pointer;
  text-align: center;
  display: inline-block;
`

const AssetIntroducer = styled.a`
  font-size: 18px;
  font-weight: 500;
  display: inline;
  cursor: pointer
  color: #000;
  text-decoration: none

  ${({ hidden }) => hidden && `
    display: none;    
  `}
`

const Pages = styled.div`
  text-align: center;
  font-weight: 400;
  padding: 10px;
`

const Page = styled.div`
  margin: 3px;
  display: inline;
  color: #b7c3cc;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  ${({ active }) => active && `
    color: black;
  `}
  ${({ off }) => off && `
    color: white;
  `}
  
  img {
    margin-bottom: -3px;
  }
`

const Sticky = styled.div`
  background-color: #FFFFFF;
  border-radius: 5px;
  position: fixed;
  right: -220px;
  bottom: 15px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  padding: 20px;
  width: 180px;
  transition: right 2s;

  ${({ active }) => active && `
    right: 15px;
  `}
`

const StickyText = styled.div`
  display: inline-block;
  margin-left: 10px;
  font-weight: 600;
  color: black;
  vertical-align: middle;
`

const X = styled.div`
  background-color: #d4001e;
  border-radius: 50%;
  height: 20px;
  width: 20px;
  color: #FFFFFF;
  font-size: 18px;
  text-align: center;
  padding: 2px 2px 3px 2px;
  display: inline-block;
  vertical-align: middle;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;
  margin-left: 30px;
`

const displayPages = 7

const balances = [
  {
    title: 'DMG Balance',
    valueBN: new BN('0')
  },
]

function shouldDisplayPage(p, selected, l) {
  if (l <= displayPages) {
    // Displays all pages if it is less than the displayed amount
    return true
  }

  const half = (displayPages - 1) / 2

  if (p <= displayPages && selected <= half) {
    // Displays displayed amount pages even if is does not have half on the left
    return true
  }
  if (p > l - displayPages && selected > l - half) {
    // Displays displayed amount pages even if is does not have half on the right
    return true
  }

  const fill = [...Array(half).keys()].map(i => i + 1)
  const left = fill.map(i => selected - i) // Uses the half array to find values to left of selected
  const right = fill.map(i => selected + i) // Uses the half array to find values to right of selected

  // Combines the selected value and two arrays to check if the value falls in here
  return [...left, selected, ...right].includes(p)
}

async function getProposals(walletAddress) {
  return fetch(`${DMM_API_URL}/v1/governance/proposals`)
    .then(response => response.json())
    .then(response => response.data.map(proposal => new ProposalSummary(proposal)))
    .then(proposals => {
      if (walletAddress) {
        return Promise.all(
          proposals.map(proposal => {
            return fetch(`${DMM_API_URL}/v1/governance/proposals/${proposal.proposalId}/results/addresses/${walletAddress}`)
              .then(response => response.json())
              .then(response => proposal.withAccount(response.data))
          })
        )
      } else {
        return proposals
      }
    })
}

async function getAccountInfo(walletAddress) {
  if (walletAddress) {
    return fetch(`${DMM_API_URL}/v1/governance/accounts/${walletAddress}`)
      .then(response => response.json())
      .then(response => !!response.data ? new AccountDetails(response.data) : null)
  } else {
    return Promise.resolve(null)
  }
}

function Vote({ language, excerpt }) {
  const t = (snippet, prop=null) => excerpt(snippet, language, prop);

  const [proposals, setProposals] = useState([])
  const [accountInfo, setAccountInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const [isActivating, setIsActivating] = useState(false)
  const [page, changePage] = useState(1)
  const [sticky, changeVisibility] = useState(false)
  let history = useHistory()

  const proposalsPerPage = window.innerWidth > 900 ? 5 : 3

  const mp = page * proposalsPerPage - proposalsPerPage
  const proposalPage = proposals.slice(mp, mp + proposalsPerPage)
  const pages = [...Array(Math.ceil(proposals.length / proposalsPerPage)).keys()].map(i => i + 1) // Creates pages off of proposals
  const l = pages.length

  const checkChange = (i) => {
    if (i > 0 && i < l + 1) changePage(i) //does not change the page value if the button is disabled
  }

  const stick = () => changeVisibility(false)

  const replacement = {
    pathname: '/governance/proposals',
    state: { isBadPath: false }
  }

  const { account: walletAddress, library } = useWeb3React()
  const web3 = new Web3(library.provider)
  balances[0].valueBN = useAddressBalance(walletAddress, DMG_ADDRESS)
  balances[0].voteCountBN = accountInfo?.voteInfo?.votesBN
  balances[0].isDelegating = accountInfo?.voteInfo?.isDelegating()

  // When component mounts - data retrieval and path check
  useEffect(() => {
    const perform = () => {
      const proposalPromise = getProposals(walletAddress).then(data => {
        setProposals(data)
      })

      const accountInfoPromise = getAccountInfo(walletAddress).then(accountInfo => {
        setAccountInfo(accountInfo)
      })

      Promise.all([proposalPromise, accountInfoPromise]).then(() => {
        setLoading(false)
      })
    }

    perform() // Do the first action
    const subscriptionId = setInterval(() => perform(), 5000)

    return () => clearInterval(subscriptionId)
  }, [walletAddress])

  // If there is a redirect from an invalid proposal ID, a sticky is displayed then history is reset
  const locationState = history.location.state
  if (locationState) {
    if (locationState.isBadPath) {
      changeVisibility(true)
      setTimeout(stick, 5000)
      history.replace(replacement)
    }
  }

  const dmgContract = useDmgContract()
  const addTransaction = useTransactionAdder()
  const isPendingDelegateTransaction = usePendingDelegation()

  const [isSameDelegateAsAccount, setIsSameDelegateAsAccount] = useState(false)

  useEffect(() => {
    const delegateAddress = accountInfo?.voteInfo?.delegateAddress
    setIsSameDelegateAsAccount(!!delegateAddress && walletAddress.toUpperCase() === delegateAddress.toUpperCase())
  }, [accountInfo, walletAddress])

  useEffect(() => {
    const subscriptionId = setTimeout(() => {
      setIsActivating(isPendingDelegateTransaction)
    }, 1000)

    return () => clearInterval(subscriptionId)
  }, [isPendingDelegateTransaction])

  const activateWallet = async () => {
    const GAS_MARGIN = ethers.BigNumber.from(1000)
    setIsActivating(true)

    const estimatedGas = await dmgContract.estimateGas
      .delegate(walletAddress)
      .catch(error => {
        console.error(`Error getting gas estimation for delegating with address ${walletAddress}: `, error)
        return ethers.BigNumber.from('500000')
      })

    dmgContract
      .delegate(walletAddress, {
        gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
      })
      .then(response => {
        setLoading(false)
        addTransaction(response, { delegate: DMG_ADDRESS })
      })
      .catch(error => {
        setLoading(false)
        if (error?.code !== 4001) {
          console.error(`Could not delegate due to error: `, error)
          Sentry.captureException(error)
        } else {
          console.log('Could not delegate because the transaction was cancelled')
        }
      })
  }

  const getBalanceButton = (index, valueBN, voteCountBN, isDelegating) => {
    if (!voteCountBN) {
      voteCountBN = new BN('0')
    }
    return (
      index === 0 ? (
          isActivating ?
            (<div style={{ float: 'right', bottom: '15px', position: 'relative' }}>
              <CircularProgress style={{ color: primaryColor }}/>
            </div>)
            :
            (<ActivateWallet hidden={!walletAddress || isDelegating || voteCountBN.gt(new BN('0'))}
                             onClick={() => activateWallet(web3, walletAddress)}>
              {t('vote.activateWallet')}
            </ActivateWallet>)
        ) :
        (
          <div/>
        )
    )
  }
  return (
    <Main>
      <Votes>
        <VoteTitle>
          {t('vote.votes')}
        </VoteTitle>
        <Amount>
          {!!accountInfo?.voteInfo?.votesBN ? amountFormatter(accountInfo?.voteInfo?.votesBN, 18, 2, true, true) : '0.00'}
        </Amount>
      </Votes>
      <Voting>
        <VotingWallet>
          <Title>
            {t('vote.yourWallet')}
          </Title>
          <Underline/>
          {balances.map(({ title, valueBN, voteCountBN, isDelegating }, index) => (
            <WalletRow key={`balance-${title}`}>
              <DMGTitle active={index === 0}>
                {t('vote.dmgBalanceTitle')}
              </DMGTitle>
              <Value active={index === 0}>
                {/*{!valueBN ? 'N/A' : amountFormatter(valueBN, 18, 2, true, true)}*/}
                {!valueBN ? '' : amountFormatter(valueBN, 18, 2, true, true)}
              </Value>
              {getBalanceButton(index, valueBN, voteCountBN, isDelegating)}
            </WalletRow>
          ))}
          <WalletRow key={`balance-delegation`}>
            <DMGTitle active={true}>
              {t('vote.delegatingVotes')}
            </DMGTitle>
            <DelegationWrapper>
              <Value>
                {!!accountInfo?.voteInfo?.delegateAddress
                  ? (
                    <Link to={`/governance/address/${accountInfo?.voteInfo?.delegateAddress}`} style={regularLink}>
                      {isSameDelegateAsAccount ? 'Self' : shorten(accountInfo?.voteInfo?.delegateAddress)}
                    </Link>
                  ) :
                  'N/A'}
              </Value>
            </DelegationWrapper>
          </WalletRow>
          <WalletRow key={`view-profile`} flex={'col'}>
            <DelegationWrapper>
              <Value>
                <PurchaseAssetIntroducerNFTButtonWrapper>
                  <Button style={purchaseAssetIntroducerSlotStyle} onClick={() => history.push('/asset-introducers/purchase')}>
                    {t('vote.becomeIntroducer')}
                  </Button>
                </PurchaseAssetIntroducerNFTButtonWrapper>
              </Value>
            </DelegationWrapper>
            <DelegationWrapper>
              <Value>
                {!!walletAddress && (
                  <ViewProfileButtonWrapper>
                    <Button style={walletButtonStyle} onClick={() => history.push(`/governance/address/${walletAddress}`)}>
                      {t('vote.viewProfile')}
                    </Button>
                  </ViewProfileButtonWrapper>
                )}
              </Value>
            </DelegationWrapper>
          </WalletRow>
        </VotingWallet>
        <GovernanceProposals>
          <GovernanceInner>
            <Title>
              {t('vote.governanceProposals')}
            </Title>
            <Underline/>
            {loading ?
              (<div style={{ textAlign: 'center' }}>
                <CircularProgress style={{ color: primaryColor }}/>
              </div>)
              :
              (<Proposals>
                {proposalPage.map((proposal) => (
                  <ProposalItem key={`proposal-${proposal.proposalId}-${walletAddress}`}
                                proposal={proposal}
                                isDelegating={!!accountInfo?.voteInfo ? accountInfo?.voteInfo?.isDelegating() : false}
                                votesBN={accountInfo?.voteInfo?.votesBN}
                                voteStatus={proposal.voteStatus}
                                setVoteStatus={(voteStatus) => {
                                  proposal.voteStatus = voteStatus
                                }}
                                language={language}
                                excerpt={excerpt}
                                walletAddress={walletAddress}/>
                ))}
              </Proposals>)
            }
            <Pages>
              <Page onClick={() => checkChange(page - 1)} off={page === 1}>
                <img src={LeftArrow} alt={'Left Arrow'}/>
              </Page>
              {pages.filter(i => shouldDisplayPage(i, page, l)).map((p, index) => (
                <Page key={`page-${index}`} onClick={() => changePage(p)} active={page === p}>
                  {p}
                </Page>
              ))}
              <Page onClick={() => checkChange(page + 1)} off={page === l || loading}>
                <img src={RightArrow} alt={'Right Arrow'}/>
              </Page>
            </Pages>
          </GovernanceInner>
        </GovernanceProposals>
      </Voting>
      <Sticky active={sticky}>
        <X>&#10006;</X>
        <StickyText>
          {t('vote.invalidID')}
        </StickyText>
      </Sticky>
    </Main>
  )
}

export default withTranslations(Vote);
