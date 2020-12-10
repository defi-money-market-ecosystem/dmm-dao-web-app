import React, { useState } from 'react'
import Close from '../../assets/svg/close-black-18dp.svg'
import styled from 'styled-components'
import { useGovernorContract } from '../../hooks'
import { ethers } from 'ethers'
import { calculateGasMargin } from '../../utils'
import * as Sentry from '@sentry/browser'
import { usePendingCastedVotes, useTransactionAdder } from '../../contexts/Transactions'
import { GOVERNOR_ALPHA_ADDRESS } from '../../contexts/GovernorAlpha'
import { primaryColor } from '../../theme'
import CircularProgress from '@material-ui/core/CircularProgress'
import { AccountProposalVoteInfo } from '../../models/AccountProposalVoteInfo'

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

const Card = styled.div`
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

const Title = styled.div`
  font-size: 32px;
  font-weight: 300;
  text-align: left;
  margin-bottom: 6px;
  color: #0a2a5a;
`

const Proposal = styled.div`
	font-size: 16px;
	text-align: left;
`

const Time = styled.div`
	font-size: 12px;
	color: #4487CE;
	text-align: left;
	opacity: 0.6;
`

const Exit = styled.div`
	position: absolute;
	right: 12px;
	top: 11px;
	cursor: pointer;
	font-size: 20px;
`

const Buttons = styled.div`
	margin-bottom: 10px;
`

const SpinnerWrapper = styled.div`
	height: 64px;
	font-weight: 430;
  font-size: 15px;
  text-align: left;
  padding-top: 12px;
	padding-bottom: 12px;
	
	@media (max-width: 540px) {
    height: 96px;	
	}
	
	@media (max-width: 320px) {
    height: 120px;	
	}
`

const CenteredSpinnerWrapper = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding-top: 12px;
	padding-bottom: 12px;
  
  @media (max-width: 540px) {
    height: 96px;	
	}
	
	@media (max-width: 320px) {
    height: 120px;	
	}
`

const TextualBody = styled.div`
	padding-top: 16px;
	padding-bottom: 16px;
	text-align: left;
`

const Button = styled.div`
	display: inline-block;
	color: #FFFFFF;
  text-align: center;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 600;
  padding: 3px;
  display: inline-block;
  margin: 10px;
  cursor: pointer;
  height: 28px;
  width: 56px;
  padding: 6px 12px;
  line-height: 28px;
  transition: opacity 0.2s ease-in-out;

  ${({ color }) => `
    background-color: ${color}
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const ErrorMessage = styled.div`
	margin-top: 20px;
	color: #cc0000;
	font-size: 13px;
	font-weight: 500;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 15px;
  margin-left: 2px;
`

//export default function Cast({ proposal, time, vote, onChange }) {
export default function CastVoteDialogue({ proposal, timestamp, votesBN, isDelegating, onClose }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false) //loading hook

  const governorContract = useGovernorContract()
  const addTransaction = useTransactionAdder()
  const proposalId = proposal.proposalId
  const isPendingCast = usePendingCastedVotes()

  const isVoteCasted = AccountProposalVoteInfo.isVoteCasted(proposal?.account?.proposalVoteInfo?.voteStatus)
  if (isVoteCasted) {
    onClose()
  }

  const castVote = async (isForProposal) => {
    const GAS_MARGIN = ethers.BigNumber.from(1000)
    setLoading(true)
    setError(null)

    const estimatedGas = await governorContract.estimateGas
      .castVote(proposalId, isForProposal)
      .catch(error => {
        console.error(`Error getting gas estimation for casting vote with ID ${proposalId}: `, error)
        return ethers.BigNumber.from('500000')
      })

    governorContract
      .castVote(proposalId, isForProposal, {
        gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
      })
      .then(response => {
        setLoading(false)
        addTransaction(response, { vote: GOVERNOR_ALPHA_ADDRESS })
      })
      .catch(error => {
        setLoading(false)
        if (error?.code !== 4001) {
          console.error(`Could not cast vote due to error: `, error)
          Sentry.captureException(error)
        } else {
          console.log('Could not cast vote because the transaction was cancelled')
        }
      })
  }

  let bodyJsx
  if (isPendingCast) {
    bodyJsx = (
      <div>
        <TextualBody>
          You currently have a vote that has been cast and is waiting to be confirmed. Please wait for the
          confirmation to finish.
        </TextualBody>
        <CircularProgress style={{ color: primaryColor }}/>
      </div>
    )
  } else if (!votesBN || (votesBN.eq(ethers.BigNumber.from('0')) && !isDelegating)) {
    bodyJsx = (
      <div>
        <TextualBody>
          Before voting for the first time, you must activate your wallet. To activate your wallet, go to the &nbsp;
          <a href={'/governance/proposals'}>home page</a> of the voting dashboard and press the 'Activate Wallet'
          button.
        </TextualBody>
      </div>
    )
  } else {
    bodyJsx = (
      <div>
        {loading ?
          <CenteredSpinnerWrapper>
            <CircularProgress style={{ color: primaryColor }}/>
          </CenteredSpinnerWrapper>
          :
          <SpinnerWrapper>
            <span>
              Cast your vote using the options below. Keep in mind, all votes are final and&nbsp;
              <strong>cannot</strong> be modified.
            </span>
          </SpinnerWrapper>
        }
        <Buttons>
          <Button color={'#09b53d'} onClick={() => castVote(true)}>
            For
          </Button>
          <Button color={'#d4001e'} onClick={() => castVote(false)}>
            Against
          </Button>
        </Buttons>
        <ErrorMessage>
          {error}
        </ErrorMessage>
      </div>
    )
  }

  return (
    <BackDrop>
      <Card>
        <Title>
          Cast your vote
        </Title>
        <Underline/>
        <Proposal>
          {proposal.title}
        </Proposal>
        <Time>
          {timestamp}
        </Time>
        {bodyJsx}
        <Exit onClick={() => onClose()}>
          <img src={Close} alt={'X'}/>
        </Exit>
      </Card>
    </BackDrop>
  )
}