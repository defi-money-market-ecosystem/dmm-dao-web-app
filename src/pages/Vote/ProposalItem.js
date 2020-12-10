import React, { useState } from 'react'
import styled from 'styled-components'
import CastVoteDialogue from './CastVoteDialogue'
import { Link } from 'react-router-dom'
import { AccountProposalVoteInfo } from '../../models/AccountProposalVoteInfo'
import { ProposalSummary } from '../../models/ProposalSummary'
import { useBlockNumber } from '../../contexts/Application'

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
  height: 56px;
  line-height: 56px;
  width: 80px;
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  transition: opacity 0.2s ease-in-out;

  @media (max-width: 540px) {
    margin-top: 12px;
  }

  color: black;
  cursor: pointer;
    
  :hover {
    opacity: 0.7;
  }
  
  ${({ disabled }) => disabled && `
    cursor: not-allowed;
    color: #b7c3cc;
    :hover {
      opacity: 1.0;
    }
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

  let voteStatus
  if (props.voteStatus) {
    voteStatus = props.voteStatus
  } else if (!props.walletAddress) {
    voteStatus = ''
  } else if (
    proposal.proposalStatus === ProposalSummary.statuses.ACTIVE &&
    (proposalVoteInfo?.voteStatus === AccountProposalVoteInfo.statuses.NO_VOTE || !proposalVoteInfo)
  ) {
    voteStatus = AccountProposalVoteInfo.statuses.VOTE
  } else {
    voteStatus = proposalVoteInfo?.voteStatus || AccountProposalVoteInfo.statuses.NO_VOTE
  }

  const [showCastDialogue, setShowCastDialogue] = useState(false)

  const isVoteButtonDisabled = voteStatus !== AccountProposalVoteInfo.statuses.VOTE

  const currentBlock = useBlockNumber();

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
            {proposal.proposalId} &#8226; {proposal.mostRecentDateText(currentBlock)}
          </Extra>
        </Info>
      </Wrapper>
      <VoteButton onClick={() => !isVoteButtonDisabled && setShowCastDialogue(true)} disabled={isVoteButtonDisabled}>
        {AccountProposalVoteInfo.toFormattedVoteButtonString(voteStatus)}
      </VoteButton>
      <div>
        {showCastDialogue ?
          <CastVoteDialogue
            proposal={proposal}
            timestamp={proposal.mostRecentDateText(currentBlock)}
            isDelegating={props.isDelegating}
            votesBN={props.votesBN}
            onClose={() => setShowCastDialogue(false)}
            vote={(v) => props.setVoteStatus(v)}/>
          : <div/>
        }
      </div>
    </Main>
  )
}
