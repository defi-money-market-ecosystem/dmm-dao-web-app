import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link, Redirect, useParams, useHistory } from 'react-router-dom'
import { useWeb3React } from '../../hooks'
import { amountFormatter, isAddress } from '../../utils'
import { ProposalSummary } from '../../models/ProposalSummary'
import { Spinner } from '../../theme'
import { DMG_ADDRESS } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import { AccountDetails } from '../../models/AccountDetails'
import BN from 'bn.js'
import CircularProgress from '@material-ui/core/CircularProgress'
import { primaryColor } from '../../theme/index'
import ProposalItem from './ProposalItem'
import DMMLogo from '../../assets/images/dmm-logo.svg'
import LeftArrow from '../../assets/svg/keyboard_arrow_left-black-18dp.svg'
import RightArrow from '../../assets/svg/keyboard_arrow_right-black-18dp.svg'
import EdiText from 'react-editext'
import Close from '../../assets/svg/close-black-18dp.svg'

const Main = styled.div`
  width: 60vw;
	overflow-y: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  ::-webkit-scrollbar { /* Hide scrollbar for Chrome, Safari and Opera */
    display: none;
  }

  @media (max-width: 100000px) {
    height: calc(100vh - 204px)
  }
  
  @media (max-width: 1000px) {
    top: 140px;
    width: 80vw;
    height: calc(100vh - 200px);
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
  font-size: 23px;
  color: black;
  font-weight: 600;
  margin-top: 15px;
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
  ${({ active }) => active && `
    color: black;
  `}
`

const TransactionField = styled.div`
  width: 33%;
  display: inline-block;
`

const View = styled.div`
	padding: 20px 30px;
	text-align: center;
  font-size: 13px;
 	font-weight: 700;
 	color: #b0bdc5;
 	transition: opacity 0.2s ease-in-out;

 	${({ active }) => active && `
    cursor: pointer;
    color: black;
  `}
  
  :hover {
    opacity: 0.7;
  }
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
  float: right; 
  margin-right: 10px;
  margin-top: 24px;
  margin-bottom: 16px;
  text-align: center;
  border-radius: 5px;
  height: 18px;
  padding: 5px 10px;
  color: black;
  cursor: pointer;
  border: 2px solid #0a2aa5a;
 
  ${({ edit }) => edit ? `
    display: inline-block;
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

const EditCard = styled.div`
  background-color: #FFFFFF;
  position: relative;
  left: 50%;
  top: 50%;
  max-width: 320px;
  width: 350px;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  opacity: 1;
  z-index: 5;
  padding: 25px 40px 5px;
  text-align: center;
  font-weight: 600;
  color: black;
  max-width: calc(80vw - 30px);
  
  @media (max-width: 700px) {
    box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  }
`

const Exit = styled.div`
  position: absolute;
  right: 12px;
  top: 11px;
  cursor: pointer;
  font-size: 20px;
`

function isValidWalletAddress(walletAddress) {
  return isAddress(walletAddress)
}

const baseUrl = 'https://api.defimoneymarket.com'

async function getProposals(walletAddress) {
  return fetch(`${baseUrl}/v1/governance/accounts/${walletAddress}`)
    .then(response => response.json())
    .then(response => response.data.vote_history.map(proposal => new ProposalSummary(proposal)))
    .then(proposals => {
      if (walletAddress) {
        return Promise.all(
          proposals.map(proposal => {
            return fetch(`${baseUrl}/v1/governance/proposals/${proposal.proposalId}/results/addresses/${walletAddress}`)
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
  return fetch(`${baseUrl}/v1/governance/accounts/${walletAddress}`)
    .then(response => response.json())
    .then(response => !!response.data ? new AccountDetails(response.data) : null)
}

const displayPages = 7


const holdings = [
  {
    title: 'DMG Balance',
    valueBN: new BN('0')
  },
  {
    title: 'Votes',
    valueBN: new BN('0')
  },
  {
    title: 'Delegating To',
    delegating: 'Undelegated'
  }
]

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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [page, changePage] = useState(1)
  const [proposals, setProposals] = useState([])
  const [accountInfo, setAccountInfo] = useState({})
  const [name, setName] = useState(null)
  const [picture, setPicture] = useState(null)
  const { account: walletAddress } = useWeb3React()
  const address = useParams().wallet_address
  let history = useHistory()
  const balance = useAddressBalance(address, DMG_ADDRESS)
  
  const [showEdit, changeShowEdit] = useState(false)

  const shorten = (a) => a ? `${a.substring(0, 6)}...${a.substring(a.length - 4, a.length)}`: 'Undelegated'
  
  holdings[0].valueBN = balance
  console.log(balance)
  holdings[1].valueBN = accountInfo?.voteInfo?.votesBN
  holdings[2].delegating = shorten(accountInfo?.voteInfo?.delegateAddress)

  const proposalsPerPage = window.innerWidth > 900 ? 5 : 3
  const mp = page * proposalsPerPage - proposalsPerPage
  const proposalPage = proposals.slice(mp, mp + proposalsPerPage)
  const pages = [...Array(Math.ceil(proposals.length / proposalsPerPage)).keys()].map(i => i + 1) //creates pages off of proposals
  const l = pages.length

  const checkChange = (i) => {
    if (i > 0 && i < l + 1) changePage(i) //does not change the page value if the button is disabled
  }

  const emptyTransaction = {
    action: '-',
    age: '-',
    result: '-'
  }
  const transactionTitles = Object.keys(emptyTransaction).map(key => key.charAt(0).toUpperCase() + key.slice(1))

  const transactionsAmount = 3;
  const loadedTransactions = []
  let transactions = []
  let lt = loadedTransactions.length
  if(lt < transactionsAmount) {
    const empty = new Array(transactionsAmount-lt)
    transactions = [...loadedTransactions, ...empty.fill(emptyTransaction)]
  } else transactions = [...loadedTransactions]

  const viewMore = (transactions) => {
    console.log('viewing more...')
  }

  useEffect(() => {
    const perform = () => {
      const proposalPromise = getProposals(address).then(data => {
        setProposals(data)
      })

      getAccountInfo(address).then(accountInfo => {
        if (accountInfo) {
          setAccountInfo(accountInfo)
          setName(accountInfo?.name)
          setPicture(accountInfo?.profilePictureUrl)

        } else {
          setAccountInfo('BAD')
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
  })

  if (!isValidWalletAddress(address) || accountInfo === 'BAD'){
    return <Redirect to={{ pathname: '/governance/proposals/' }}/>
  }

  const edit = address === address //walletAddress

  let prevPath = null
  const locationState = history.location.state
  if (locationState) {
    prevPath = locationState.prevPath
  }

  return (
    <Main>
      <Link to={prevPath ? prevPath : '/governance/proposals'} style={backLink}>
        &#8592; {prevPath ? 'Details' : 'Overview'}
      </Link>
      <div>
        <Wrapper>
          <Image>
            <img src={DMMLogo} style={pfp} alt={"pfp"}/>
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
              </div>:
              <OnlyAddress>
                {address}
              </OnlyAddress> 
            }
          </Info>
        </Wrapper>
        <Edit
          onClick={() => changeShowEdit(true)}
          edit={edit}
        >
          Edit
        </Edit>
      </div>
      <div>
        <Card width={35}>
          <Title>
            Holdings
          </Title>
          <Underline/>
          {holdings.map(({ title, valueBN, delegating }, index) => (
            <Balance key={`balance-${title}`}>
              <DMGTitle active={false}>
                {title}
              </DMGTitle>
              <Value active={true}>
                {!valueBN ? delegating : amountFormatter(valueBN, 18, 2)}
              </Value>
            </Balance>
          ))}
        </Card>
        <Card width={65}>
          <Title>
            Transactions
          </Title>
          <Underline/>
          <div>
          <Transactions>
            <Transaction>
              {transactionTitles.map(title => (
                <TransactionField>{title}</TransactionField>
              ))}
            </Transaction>
            {transactions.slice(0,transactionsAmount).map(({action, age, result}) => (
              <Transaction active={action !== "-"}>
                <TransactionField>{action}</TransactionField>
                <TransactionField>{age}</TransactionField>
                <TransactionField>{result}</TransactionField>
              </Transaction>
            ))}
          </Transactions>
          </div>
          {transactions.length > transactionsAmount ? (
            <View onClick={() => viewMore(transactions)}>
              {'View More'}
            </View>
          ) : (<span/>)}
        </Card>
        <Card width={100}>
          <Title>
            Voting History
          </Title>
          <Underline/>
          {loading ?
            (<div style={{ textAlign: 'center' }}>
              <CircularProgress style={{ color: primaryColor }}/>
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
              <img src={LeftArrow} alt={'Left Arrow'}/>
            </Page>
            {pages.filter(i => display(i, page, l)).map((p, index) => (
              <Page key={`page-${index}`} onClick={() => changePage(p)} active={page === p}>
                {p}
              </Page>
            ))}
            <Page onClick={() => checkChange(page + 1)} off={page === l || loading}>
              <img src={RightArrow} alt={'Right Arrow'}/>
            </Page>
          </Pages>
        </Card>
      </div>
      {showEdit ?
        <BackDrop>
        <Card>
          
          <Exit onClick={() => changeShowEdit(false)}>
            <img src={Close} alt={'X'}/>
          </Exit>
        </Card>
      </BackDrop>
        : null
      }
    </Main>
  )
}