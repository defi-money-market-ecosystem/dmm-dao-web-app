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

`

const Light = styled.span`
  color: #b7c3cc;
`

const Value = styled.div`
  margin-top: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #b7c3cc;
  display: inline;

  ${({ active }) => active && `
    color: black;
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
  float: center

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

const DelegateButton = styled.div`
  font-size: 10px;
  border-radius: 3px;
  font-weight: 700;
  background-color: #327ccb;
  max-width: 100px;
  color: white;
  margin: 10px auto 0;
  padding: 5px;
  cursor: pointer;
  display: none;
  text-align: center;
  width: calc(100% - 10px);

  ${({ active }) => active && `
    display: block;
  `}
`

const dt = styled.div`
  margin: 0;
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
  if (l <= displayPages) return true //displays all pages if it is less than the diplayed amount

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

  const holdings = [
    {
      title: t('profile.dmgBalance'),
      valueBN: ethers.constants.Zero
    },
    {
      title: t('profile.votes'),
      valueBN: ethers.constants.Zero
    },
    {
      title: t('profile.deleagtingTo'),
      delegating: null
    }
  ]

  const [loading, setLoading] = useState(true)
  const [page, changePage] = useState(1)
  const [proposals, setProposals] = useState([])
  const [accountInfo, setAccountInfo] = useState({})
  const [name, setName] = useState(null)
  const [picture, setPicture] = useState(null)
  const [rank, setRank] = useState('N/A')
  const [loadedTransactions, setTransactions] = useState([])
  const [delgateView, setDelegateView] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [viewMore, changeViewMore] = useState(false)
  const [nfts, setNfts] = useState([])

  const { account: walletAddress, library } = useWeb3React()
  const address = useParams().wallet_address
  let history = useHistory()
  const balance = useAddressBalance(address, DMG_ADDRESS)
  const edit = address === walletAddress

  const [showEdit, changeShowEdit] = useState(false)
  const shorten = (a) => isAddress(a) ? `${a.substring(0, 6)}...${a.substring(a.length - 4, a.length)}` : a

  const delegate = accountInfo?.vote_info?.delegate_address || true
  holdings[0].valueBN = balance
  holdings[1].valueBN = accountInfo ? accountInfo.vote_info?.votes_padded : 'N/A'
  holdings[2].delegating = delegate === address ? t('profile.self') : delegate

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
  let transactions = []
  let lt = loadedTransactions.length
  if (lt < transactionsAmount) {
    const empty = new Array(transactionsAmount - lt)
    transactions = [...loadedTransactions, ...empty.fill(emptyTransaction)]
  } else transactions = [...loadedTransactions]

  useEffect(() => {
    const perform = () => {
      const proposalPromise = getProposals(address).then(data => {
        setProposals(data)
      })

      getNFTs(address).then(data => {
        setNfts(data)
      })

      getAccountInfo(address).then(accountInfo => {
        if (accountInfo) {
          setAccountInfo(accountInfo)
          setName(accountInfo?.name)
          setPicture(accountInfo?.profilePictureUrl)
          setTransactions(accountInfo?.transactions)
          setRank(accountInfo?.rank)
        }
      })

      Promise.all([proposalPromise]).then(() => {
        setLoading(false)
      })
    }

    perform()
    const subscriptionId = setInterval(() => {
      perform()
    }, 15000)

    return () => clearInterval(subscriptionId)
  }, [walletAddress])

  const dmgContract = useDmgContract()
  const isPendingDelegateTransaction = usePendingDelegation()
  const web3 = new Web3(library.provider)
  const addTransaction = useTransactionAdder()

  useEffect(() => {
    const subscriptionId = setTimeout(() => {
      setIsActivating(isPendingDelegateTransaction)
    }, 10000)

    return () => clearInterval(subscriptionId)
  }, [isPendingDelegateTransaction])

  if (!isValidWalletAddress(address)) {
    return <Redirect to={{ pathname: '/governance/proposals/' }} />
  }

  let prevPath = null
  const locationState = history.location.state
  if (locationState) {
    prevPath = locationState.prevPath
  }

  const handleClick = (e) => {
    // if (e) {}
    setDelegateView(false)
  }

  //fix editing logic
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
              <span style={defaultPfp} class="material-icons">
                account_circle
              </span>
            }
          </Image>
          <Info>
            {name ?
              <div>
                <Name>
                  {name}
                </Name>
                <AddressBottom>
                  {address}
                </AddressBottom>
              </div> :
              <OnlyAddress>
                {window.innerWidth > 725 ? address : shorten(address)}
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
          {holdings.map(({ title, valueBN, delegating }, index) => (
            <Balance key={`balance-${title}`}>
              <DMGTitle active={false}>
                {title}
              </DMGTitle>
              <Value active={true}>
                {isActivating || !edit ? (!valueBN ? shorten(delegating) : amountFormatter(ethers.BigNumber.from(valueBN), 18, 2)) : 'N/A'}
                {/*<DelegateButton active={delegating} onClick={() => setDelegateView(true)}>*/}
                {/*  { edit ? */}
                {/*    (*/}
                {/*      isActivating ?*/}
                {/*      <dt>Delegate to Self</dt>:*/}
                {/*      <dt onClick={() => activateWallet(web3, walletAddress)}>Activate Wallet</dt>*/}
                {/*    ):*/}
                {/*    <div>*/}
                {/*      <dt>Delegate to</dt>*/}
                {/*      <dt>{(name || shorten(address))}</dt>*/}
                {/*    </div>*/}
                {/*  }*/}
                {/*</DelegateButton>*/}
              </Value>
            </Balance>
          ))}
          { nfts && nfts.length > 0 &&
          <Balance key={`balance-NFT`}>
            <DMGTitle active={false}>
              NFTs
            </DMGTitle>
            {nfts.map(nft =>
              <NFTSection>
                {nft.country_name} - {t('profile.'+nft.introduer_type)}
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
                  walletAddress={address}
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
                    {vote_delta === '-' ? vote_delta : `${vote_delta.charAt(0) === '-' ? t('profile.lost') : t('profile.received')} ${vote_delta === '-' ? null : amountFormatter(ethers.BigNumber.from(vote_delta), 18, 2)} ${t('profile.votes')}`}
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
      {delgateView ?
        <DelegateDialogue
          address={address}
          self={edit}
          isDelegating={!!accountInfo?.voteInfo ? accountInfo?.voteInfo?.isDelegating() : false}
          onChange={e => handleClick(e)} />
        : null
      }
    </Main>
  )
}

export default withTranslations(ProfilePage);