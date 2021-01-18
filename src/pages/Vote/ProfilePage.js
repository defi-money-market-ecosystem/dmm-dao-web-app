import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link, Redirect, useParams, useHistory } from 'react-router-dom'
import { useDmgContract, useWeb3React } from '../../hooks'
import { amountFormatter, isAddress, calculateGasMargin, DMM_API_URL } from '../../utils'
import { ProposalSummary } from '../../models/ProposalSummary'
import { DMG_ADDRESS } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import CircularProgress from '@material-ui/core/CircularProgress'
import { primaryColor } from '../../theme/index'
import { usePendingDelegation, useTransactionAdder } from '../../contexts/Transactions'
import ProposalItem from './ProposalItem'
import LeftArrow from '../../assets/svg/keyboard_arrow_left-black-18dp.svg'
import RightArrow from '../../assets/svg/keyboard_arrow_right-black-18dp.svg'
import EdiText from 'react-editext' //for  edit
import Close from '../../assets/svg/close-black-18dp.svg'
import DelegateDialogue from './DelegateDialogue'
import { ethers } from 'ethers'
import Web3 from 'web3'
import { BigNumber } from 'ethers-utils'
import * as Sentry from '@sentry/browser'
import DMG_ABI from '../../constants/abis/dmg'

import { withTranslations } from '../../services/Translations/Translations';

const Main = styled.div`
  width: 60vw;
	overflow-y: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  ::-webkit-scrollbar { /* Hide scrollbar for Chrome, Safari and Opera */
    display: none;
  }

  @media (max-width: 100000px) {
  }
  
  @media (max-width: 1000px) {
    top: 140px;
    width: 80vw;
  }

  @media (max-width: 800px) {
    width: 90vw;
  }
`

const backLink = {
  textDecoration: 'none',
  color: '#808080',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '15px',
  marginLeft: '10px'
}

const regularLink = {
  textDecoration: 'none',
  color: `${primaryColor}`,
  cursor: 'pointer',
}

const Wrapper = styled.div`
	margin-top: 20px;
	margin-left: 10px;
	display: inline-block;
`

const pfp = {
  width: '60px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: '50%'
}

const defaultPfp = {
  color: '#327ccb',
  fontSize: '60px'
}

const Name = styled.div`
  font-size: 23px;
  color: black;
  font-weight: 600;
`

const AddressBottom = styled.div`
  font-size: 16px;
  color: black;
  font-weight: 600;
  margin-top: 5px;
`

const OnlyAddress = styled.div`
  font-size: 18px;
  color: black;
  font-weight: 600;
  margin-top: 20px;
  margin-left: -10px;
`

const Info = styled.div`
	display: inline-block;
  vertical-align: top;
  margin-left: 10px;
`

const Image = styled.div`
  vertical-align: top;
  display: inline-block;
`

const Card = styled.div`
  background-color: #FFFFFF;
  ${({ width }) => `
    width: calc(${width}% - 20px);
  `}
  border-radius: 5px;
  margin: 10px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;

  @media (max-width: 767px) {
    width: calc(100% - 20px);
  }
`

const Popup = styled.div`
  background-color: #FFFFFF;
  position: relative;
  left: 50%;
  top: 50%;
  max-width: 320px;
  width: 350px;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  opacity: 1;
  z-index: 500;
  padding: 25px 40px 5px;
  text-align: center;
  font-weight: 600;
  color: black;
  max-width: calc(80vw - 30px);
  max-height: 70vh;
  overflow-y: scroll;
  
  @media (max-width: 700px) {
    box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  }
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

const Balance = styled.div`
  padding: 20px 30px;
  border-bottom: 1px solid #DCDCDC;
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

const NFTSection = styled.div`
  padding-top: 8px;
`

const Light = styled.span`
  color: #b7c3cc;
`

const Value = styled.div`
  padding-top: 8px;
  font-size: 18px;
  font-weight: 600;
  color: black;

  ${({ inline }) => inline && `
    display: inline-block;
    padding: 0;
    margin: auto;
    margin-right: 16px;
  `}
`

const Transactions = styled.div`
  width: 100%;
  height: auto;

  ${({ small }) => small && `
    display: table;
     margin-bottom: 15px;
  `}
`

const Transaction = styled.div`
  float: left;
  display: inline;
  padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 15px;
  font-weight: 600;
  width: calc(100% - 60px);
  color: #b0bdc5;
  text-align: left;

  ${({ active }) => active && `
    color: black;
    cursor: pointer;
    :hover {
      background-color: 0.7;
    }
  `}

  ${({ small }) => small && `
    padding: 10px 15px;
    border-bottom: 1px solid #e2e2e2;
    font-size: 12px;
    width: calc(100% - 30px);
  `}
`

const TransactionField = styled.div`
  width: 30%;
  display: inline-block;

   ${({ long }) => long && `
    width: 70%;
  `}
`

const View = styled.div`
	text-align: center;
 	transition: opacity 0.2s ease-in-out;
  cursor: pointer;
  float: center;
  margin: auto;

 	${({ active }) => active && `
    color: black;
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const ViewText = styled.div`
   font-size: 13px;
   font-weight: 700;
   margin: 10px auto;
   color: #b0bdc5;
   display: inline-block;
`

const Pages = styled.div`
  text-align: center;
  font-weight: 400;
  margin: 10px;
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

const Proposals = styled.div`
  height: calc(100% - 62px);
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;
  margin-left: 30px;
`

const Edit = styled.div`
  font-size: 15px;
  font-weight: 700;
  height: 18px;
  color: black;
  cursor: pointer;
  border: 2px solid #0a2aa5a;
 
  ${({ edit }) => edit ? `
    display: block;
  ` : `
    display: none;
  `}
`

const BackDrop = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.5);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 110;
  
  @media (max-width: 700px) {
    background: none;
  }
`

const Exit = styled.div`
  position: absolute;
  right: 12px;
  top: 11px;
  cursor: pointer;
  font-size: 20px;
`

const Rank = styled.div`
  float: right;
  display: inline;
  height: fit-content;
  width: 50px;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  background-color: #327ccb;
  color: abb9c1;
  margin-right: 10px;
`

const RankNum = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-top: 5px;
`

const ActivateWalletWrapper = styled.div`
  padding-top: 8px;
`

const ActivateWallet = styled.div`
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
  
  ${({ isPersonalDelegatingToProfile }) => isPersonalDelegatingToProfile && `
    cursor: default;
    color: #000;
    background-color: #FFF;
    text-align: left;
    max-width: 999px;
    padding: 0;
  `}
  
  ${({ isDelegatingToSelf }) => isDelegatingToSelf && `
    display: none;
  `}
    
   ${({ isActivating }) => isActivating && `
    background-color: #FFF;
  `}
`

const SpinnerWrapper = styled.div`
  height: 24px;
  width: 24px
  margin: auto; 
`

function isValidWalletAddress(walletAddress) {
  return isAddress(walletAddress)
}

async function getProposals(walletAddress) {
  return fetch(`${DMM_API_URL}/v1/governance/accounts/${walletAddress}`)
    .then(response => response.json())
    .then(response => response.data ? response.data.vote_history.map(proposal => new ProposalSummary(proposal)) : [])
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

async function getNFTs(walletAddress) {
  return fetch(`${DMM_API_URL}/v1/governance/accounts/${walletAddress}`)
    .then(response => response.json())
    .then(response => response.data.asset_introducer_nfts)
}

async function getAccountInfo(walletAddress) {
  return fetch(`${DMM_API_URL}/v1/governance/accounts/${walletAddress}`)// 0x0F9Dd46B0E1F77ceC0f66C20B9a1F56Cb34A4556
    .then(response => response.json())
    .then(response => !!response.data ? response.data : null)
}

const displayPages = 7

function display(p, selected, l) {
  if (l <= displayPages) return true //displays all pages if it is less than the displayed amount

  const half = (displayPages - 1) / 2

  if (p <= displayPages && selected <= half) return true //displays displayed amount pages even if is does not have half on the left
  if (p > l - displayPages && selected > l - half) return true //displays displayed amount pages even if is does not have half on the right

  const fill = [...Array(half).keys()].map(i => i + 1) //gets a half array
  const left = fill.map(i => selected - i) //uses the half array to find values to left of selected
  const right = fill.map(i => selected + i) //uses the half array to find values to right of selected
  return [...left, selected, ...right].includes(p) //combines the selected value and two arrays to check if the value falls in here
}

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function ProfilePage(props) {
  const t = (snippet, prop=null) => props.excerpt(snippet, props.language, prop);

  const [loading, setLoading] = useState(true)
  const [page, changePage] = useState(1)
  const [proposals, setProposals] = useState([])
  const [accountInfo, setAccountInfo] = useState({})
  const [personalAccountInfo, setPersonalAccountInfo] = useState({})
  const [profileName, setName] = useState(null)
  const [picture, setPicture] = useState(null)
  const [rank, setRank] = useState('N/A')
  const [loadedTransactions, setTransactions] = useState([])
  const [delgateView, setDelegateView] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [viewMore, changeViewMore] = useState(false)
  const [nfts, setNfts] = useState([])

  const { account: walletAddress, library } = useWeb3React()
  const profileAddress = useParams().wallet_address
  let history = useHistory()
  const balance = useAddressBalance(profileAddress, DMG_ADDRESS)

  const [isSameDelegateAsProfile, setIsSameDelegateAsProfile] = useState(false)
  const [isPersonalSameDelegateAsProfile, setIsPersonalSameDelegateAsProfile] = useState(false)
  const [isSameAccountAsProfile, setIsSameAccountAsProfile] = useState(false)

  useEffect(() => {
    const delegateAddress = accountInfo?.vote_info?.delegate_address
    setIsSameDelegateAsProfile(!!delegateAddress && profileAddress.toUpperCase() === delegateAddress.toUpperCase())
  }, [accountInfo, profileAddress])

  useEffect(() => {
    const personalDelegateAddress = personalAccountInfo?.vote_info?.delegate_address
    setIsPersonalSameDelegateAsProfile(!!personalDelegateAddress && profileAddress.toUpperCase() === personalDelegateAddress.toUpperCase())
  }, [personalAccountInfo, profileAddress])

  useEffect(() => {
    setIsSameAccountAsProfile(!!walletAddress && profileAddress.toUpperCase() === walletAddress.toUpperCase())
  }, [walletAddress, profileAddress])

  const [showEdit, changeShowEdit] = useState(false)
  const shorten = (a) => isAddress(a) ? `${a.substring(0, 6)}...${a.substring(a.length - 4, a.length)}` : a

  const [holdings, setHoldings] = useState([
      {
        title: t('profile.dmgBalance'),
        valueBN: ethers.constants.Zero,
        delegateAddress: '',
        personalDelegateAddress: '',
        isDelegate: false
      },
      {
        title: t('profile.votes'),
        valueBN: ethers.constants.Zero,
        delegateAddress: '',
        personalDelegateAddress: '',
        isDelegate: false
      },
      {
        title: t('profile.deleagtingTo'),
        valueBN: undefined,
        delegateAddress: accountInfo?.vote_info?.delegate_address,
        personalDelegateAddress: personalAccountInfo?.vote_info?.delegate_address,
        isDelegate: true
      }
    ]
  )

  useEffect(() => {
    setHoldings([
        {
          title: holdings[0].title,
          valueBN: balance || ethers.constants.Zero,
          delegateAddress: null,
          isDelegate: false
        },
        {
          title: holdings[1].title,
          valueBN: accountInfo?.vote_info?.votes_padded || ethers.constants.Zero,
          delegateAddress: null,
          isDelegate: false
        },
        {
          title: holdings[2].title,
          valueBN: undefined,
          delegateAddress: accountInfo?.vote_info?.delegate_address,
          personalDelegateAddress: personalAccountInfo?.vote_info?.delegate_address,
          isDelegate: true
        }
      ]
    )
  }, [accountInfo, balance])

  const proposalsPerPage = window.innerWidth > 900 ? 5 : 3
  const mp = page * proposalsPerPage - proposalsPerPage
  const proposalPage = proposals.slice(mp, mp + proposalsPerPage)
  const pages = [...Array(Math.ceil(proposals.length / proposalsPerPage)).keys()].map(i => i + 1) //creates pages off of proposals
  const l = pages.length

  const checkChange = (i) => {
    if (i > 0 && i < l + 1) changePage(i) //does not change the page value if the button is disabled
  }

  const emptyTransaction = {
    vote_delta: '-',
    block_number: '-'
  }

  const transactionTitles = [t('profile.action'), t('profile.blockNumber')]
  const transactionsAmount = 3
  let transactions
  let lt = loadedTransactions.length
  if (lt < transactionsAmount) {
    const empty = new Array(transactionsAmount - lt)
    transactions = [...loadedTransactions, ...empty.fill(emptyTransaction)]
  } else {
    transactions = [...loadedTransactions]
  }

  useEffect(() => {
    const perform = () => {
      const proposalPromise = getProposals(profileAddress).then(data => {
        setProposals(data)
      })

      getNFTs(profileAddress).then(data => {
        setNfts(data)
      })

      getAccountInfo(profileAddress).then(accountInfo => {
        if (accountInfo) {
          setAccountInfo(accountInfo)
          setName(accountInfo?.name)
          setPicture(accountInfo?.profilePictureUrl)
          setTransactions(accountInfo?.transactions)
          setRank(accountInfo?.rank)
        }
        if (!!walletAddress && profileAddress.toUpperCase() === walletAddress.toUpperCase()) {
          setPersonalAccountInfo(accountInfo)
        }
      })

      if (!!walletAddress && walletAddress.toUpperCase() !== profileAddress.toUpperCase()) {
        getAccountInfo(walletAddress).then(personalAccountInfo => {
          if (personalAccountInfo) {
            setPersonalAccountInfo(personalAccountInfo)
          }
        })
      }

      Promise.all([proposalPromise]).then(() => {
        setLoading(false)
      })
    }

    perform()
    const subscriptionId = setInterval(() => {
      perform()
    }, 15000)

    return () => clearInterval(subscriptionId)
  }, [walletAddress, profileAddress])

  const dmgContract = useDmgContract()
  const isPendingDelegateTransaction = usePendingDelegation()
  const addTransaction = useTransactionAdder()

  useEffect(() => {
    const subscriptionId = setTimeout(() => {
      setIsActivating(isPendingDelegateTransaction)
    }, 10000)

    return () => clearInterval(subscriptionId)
  }, [isPendingDelegateTransaction])

  if (!isValidWalletAddress(profileAddress)) {
    return <Redirect to={{ pathname: '/governance/proposals/' }} />
  }

  const prevPath = history.location.state?.prevPath

  const handleChangeDelegate = async (isCancel) => {
    if (isCancel) {
      setDelegateView(false)
    } else {
      const delegateAddress = profileAddress
      const GAS_MARGIN = ethers.BigNumber.from(1000)
      const estimatedGas = await dmgContract.estimateGas
        .delegate(delegateAddress)
        .catch(error => {
          console.error(`Error getting gas estimation for delegating with address ${delegateAddress}: `, error)
          return ethers.BigNumber.from('500000')
        })

      return dmgContract
        .delegate(delegateAddress, {
          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
        })
        .then(response => {
          setLoading(false)
          addTransaction(response, { delegate: DMG_ADDRESS })
          setDelegateView(false)
          setIsActivating(true)
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
  }

  const openEtherscan = (hash) => {
    if (!!hash) window.open(`https://etherscan.io/tx/${hash}`)
  }

  return (
    <Main>
      <Link to={prevPath ? prevPath : '/governance/proposals'} style={backLink}>
        &#8592; {prevPath ? t('profile.details') : t('profile.overview')}
      </Link>
      <div>
        <Wrapper>
          <Image>
            {!!picture ?
              <img src={picture} style={pfp} alt={'pfp'} /> :
              <span style={defaultPfp} className={'material-icons'}>
                account_circle
              </span>
            }
          </Image>
          <Info>
            {profileName ?
              <div>
                <Name>
                  {profileName}
                </Name>
                <AddressBottom>
                  {profileAddress}
                </AddressBottom>
              </div> :
              <OnlyAddress>
                {window.innerWidth > 725 ? profileAddress : shorten(profileAddress)}
              </OnlyAddress>
            }
          </Info>
          {/*
          //Editing currently disabled
          <Edit
            onClick={() => changeShowEdit(true)}
            edit={edit}
          >
            Edit
          </Edit>
        */}
        </Wrapper>
        <Rank>
          {t('profile.rank')}
          <RankNum>
            {rank}
          </RankNum>
        </Rank>
      </div>
      <div>
        <Card width={35}>
          <Title>
            {t('profile.holdings')}
          </Title>
          <Underline />
          {holdings.map(({ title, valueBN, delegateAddress, personalDelegateAddress, isDelegate }, index) => (
            <Balance key={`balance-${title}`}>
              <DMGTitle active={false}>
                {title}
              </DMGTitle>
              {!isDelegate ? (
                <Value>
                  {!valueBN ? 'N/A' : amountFormatter(ethers.BigNumber.from(valueBN), 18, 2, true, true)}
                </Value>
              ) : (
                <ActivateWalletWrapper>
                  <Value inline={true}>
                    {isSameDelegateAsProfile
                      ? 'Self'
                      : <Link to={`/governance/address/${delegateAddress}`} style={regularLink}>{shorten(delegateAddress)}</Link>
                    }
                  </Value>
                  <ActivateWallet
                    isDelegatingToSelf={isPersonalSameDelegateAsProfile && isSameAccountAsProfile}
                    isPersonalDelegatingToProfile={isPersonalSameDelegateAsProfile}
                    isActivating={isActivating}
                    onClick={() => setDelegateView(!isPersonalSameDelegateAsProfile)}>
                    {isActivating ? (
                      <SpinnerWrapper><CircularProgress
                        style={{ color: primaryColor, width: 24, height: 24 }} /></SpinnerWrapper>
                    ) : (
                      isPersonalSameDelegateAsProfile ? (
                        <dt>
                          You are delegating to this profile
                        </dt>
                      ) : (
                        <dt>
                          Delegate to {isSameAccountAsProfile ? 'Self' : profileName || shorten(delegateAddress)}
                        </dt>
                      )
                    )}
                  </ActivateWallet>
                </ActivateWalletWrapper>

              )}
            </Balance>
          ))}
          {nfts && nfts.length > 0 &&
            <Balance key={`balance-NFT`}>
              <DMGTitle active={false}>
                NFTs
              </DMGTitle>
              {nfts.map(nft =>
                <NFTSection>
                  {nft.country_name} - {t('profile.' + nft.introduer_type)}
                </NFTSection>
              )}
            </Balance>
          }
        </Card>
        <Card width={65}>
          <Title>
            {t('profile.transactions')}
          </Title>
          <Underline />
          <div>
            <Transactions>
              <Transaction>
                {transactionTitles.map((title, i) => (
                  <TransactionField long={!i}>{title}</TransactionField>
                ))}
              </Transaction>
              {transactions.slice(0, transactionsAmount).map(({ vote_delta, block_number, transaction_hash }) => (
                <Transaction active={!!transaction_hash} onClick={() => openEtherscan(transaction_hash)}>
                  <TransactionField long>
                    {vote_delta === '-' ? vote_delta : `${vote_delta.charAt(0) === '-' ? t('profile.lost') : t('profile.received')} ${vote_delta === '-' ? null : amountFormatter(ethers.BigNumber.from(vote_delta.replaceAll('-', '')), 18, 2, true, true)} ${t('profile.votes')}`}
                  </TransactionField>
                  <TransactionField>{block_number}</TransactionField>
                </Transaction>
              ))}
            </Transactions>
          </div>
          {transactions.length > transactionsAmount ? (
            <View onClick={() => changeViewMore(true)}>
              <ViewText>
                {t('profile.viewMore')}
              </ViewText>
            </View>
          ) : (<span />)}
        </Card>
        <Card width={100}>
          <Title>
            {t('profile.votingHistory')}
          </Title>
          <Underline />
          {loading ?
            (<div style={{ textAlign: 'center' }}>
              <CircularProgress style={{ color: primaryColor }} />
            </div>)
            :
            (<Proposals>
              {proposalPage.map((proposal) => (
                <ProposalItem
                  key={`proposal-${proposal.proposalId}`}
                  proposal={proposal}
                  isDelegating={!!accountInfo?.voteInfo ? accountInfo?.voteInfo?.isDelegating() : false}
                  votesBN={accountInfo?.voteInfo?.votesBN}
                  walletAddress={profileAddress}
                />
              ))}
            </Proposals>)
          }
          <Pages>
            <Page onClick={() => checkChange(page - 1)} off={page === 1}>
              <img src={LeftArrow} alt={'Left Arrow'} />
            </Page>
            {pages.filter(i => display(i, page, l)).map((p, index) => (
              <Page key={`page-${index}`} onClick={() => changePage(p)} active={page === p}>
                {p}
              </Page>
            ))}
            <Page onClick={() => checkChange(page + 1)} off={page === l || loading}>
              <img src={RightArrow} alt={'Right Arrow'} />
            </Page>
          </Pages>
        </Card>
      </div>
      {viewMore ?
        <BackDrop>
          <Popup>
            <Transactions small>
              <Transaction small>
                {transactionTitles.map((title, i) => (
                  <TransactionField long={!i}>{title}</TransactionField>
                ))}
              </Transaction>
              {transactions.map(({ vote_delta, block_number, transaction_hash }) => (
                <Transaction small active={!!transaction_hash} onClick={() => openEtherscan(transaction_hash)}>
                  <TransactionField long>
                    {vote_delta === '-' ? vote_delta : `${vote_delta.charAt(0) === '-' ? t('profile.lost') : t('profile.received')} ${vote_delta === '-' ? null : amountFormatter(ethers.BigNumber.from(vote_delta.replaceAll('-', '')), 18, 2, true, true)} ${t('profile.votes')}`}
                  </TransactionField>
                  <TransactionField>{block_number}</TransactionField>
                </Transaction>
              ))}
            </Transactions>
            <Exit onClick={() => changeViewMore(false)}>
              <img src={Close} alt={'X'} />
            </Exit>
          </Popup>
        </BackDrop>
        : null
      }
      {showEdit ?
        <BackDrop>
          <Popup>
            <Exit onClick={() => changeShowEdit(false)}>
              <img src={Close} alt={'X'} />
            </Exit>
          </Popup>
        </BackDrop>
        : null
      }
      {delgateView &&
      <DelegateDialogue
        address={profileAddress}
        self={isSameAccountAsProfile}
        isAlreadyDelegating={!!accountInfo?.voteInfo ? (accountInfo?.voteInfo?.isDelegating() || isActivating) : false}
        onChange={(isCancel) => handleChangeDelegate(isCancel)} />
      }
    </Main>
  )
}

export default withTranslations(ProfilePage);