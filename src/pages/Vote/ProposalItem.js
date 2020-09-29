import React, { useState } from 'react'
import styled from 'styled-components'
import CastVoteDialogue from './CastVoteDialogue'
import { Link } from 'react-router-dom'
import { AccountProposalVoteInfo } from '../../models/AccountProposalVoteInfo'
import { ProposalSummary } from '../../models/ProposalSummary'

const Main = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: black;
  padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  height: 100%;
  width: calc(100% - 60px);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 540px) {
    flex-direction: column;
  }
`

const Wrapper = styled.div`
  height: 100%;
  width: 80%;
  display: inline-block;

 	@media (max-width: 450px) {
 		margin-bottom: 10px;
    width: 100%;
  }
`

const Info = styled.div`
	padding-top: 10px;
	font-size: 12px;
  font-weight: 600;
  color: #b7c3cc;

  ${({ active }) => active && `
      color: #327ccb;
  `}
`
const Status = styled.div`
  color: #67dc4d;
  text-align: center;
  background-color: #FFFFFF;
  border: 2px solid #67dc4d;
  border-radius: 5px;
  height: 15px;
  width: 75px;
  padding: 3px;
  display: inline-block;

  ${({ active }) => active && `
      border: 2px solid #327ccb;
      color: #327ccb;
  `}
  
  @media (max-width: 400px) {
    margin-bottom: 8px;
  }
`

const VoteButton = styled.div`
  height: 100%;
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
  color: #b7c3cc;
  text-align: center;
  transition: opacity 0.2s ease-in-out;
  width: 20%;

  @media (max-width: 540px) {
    margin-top: 12px;
  }

  ${({ cast }) => cast && `
    color: black;
    cursor: pointer;
    
    :hover {
      opacity: 0.7;
    }
  `}
  ${({ disabled }) => disabled && `
    cursor: none;
  `}
`

const Extra = styled.div`
  font-weight: 700;
	padding-left: 7px;
	display: inline-block;
`

const link = {
  textDecoration: 'none',
  color: 'black',
  cursor: 'pointer'
}

export default function ProposalItem(props) {
  const proposal = props.proposal
  const proposalVoteInfo = proposal?.account?.proposalVoteInfo

  let initialVoteStatus
  if (!props.walletAddress) {
    initialVoteStatus = ''
  } else if (
    proposal.proposalStatus === ProposalSummary.statuses.ACTIVE &&
    (proposalVoteInfo?.voteStatus === AccountProposalVoteInfo.statuses.NO_VOTE || !proposalVoteInfo)
  ) {
    initialVoteStatus = AccountProposalVoteInfo.statuses.VOTE
  } else {
    initialVoteStatus = proposalVoteInfo?.voteStatus || AccountProposalVoteInfo.statuses.NO_VOTE
  }
  const [voteStatus, setVoteStatus] = useState(initialVoteStatus)

  const [showCastDialogue, setShowCastDialogue] = useState(false)

  const isVoteButtonDisabled = voteStatus !== AccountProposalVoteInfo.statuses.VOTE

  return (
    <Main>
      <Wrapper>
        <Link to={`/governance/proposals/${proposal.proposalId}`} style={link}>
          {proposal.title}
        </Link>
        <Info active={proposal.proposalStatus}>
          <Status active={proposal.proposalStatus}>
            {proposal.proposalStatusFormatted()}
          </Status>
          <Extra>
            {proposal.proposalId} &#8226; {proposal.mostRecentDateText()}
          </Extra>
        </Info>
      </Wrapper>
      <VoteButton onClick={() => !isVoteButtonDisabled && setShowCastDialogue(true)} disabled={isVoteButtonDisabled}>
        {AccountProposalVoteInfo.toFormattedVoteButtonString(voteStatus)}
      </VoteButton>
      {showCastDialogue ?
        <CastVoteDialogue
          proposal={proposal}
          timestamp={proposal.mostRecentDateText()}
          isDelegating={props.isDelegating}
          votesBN={props.votesBN}
          onChange={(shouldShow) => setShowCastDialogue(shouldShow)}
          vote={(v) => setVoteStatus(v)}/>
        : <div/>
      }
    </Main>
  )
}
