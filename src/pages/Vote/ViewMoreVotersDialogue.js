import React from 'react'
import Close from '../../assets/svg/close-black-18dp.svg'
import styled from 'styled-components'
import { amountFormatter, MIN_DECIMALS, shorten } from '../../utils'
import { primaryColor } from '../../theme'

import { ReactComponent as ExternalLink } from '../../assets/svg/ExternalLink.svg'

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

const Exit = styled.div`
	position: absolute;
	right: 12px;
	top: 11px;
	cursor: pointer;
	font-size: 20px;
`

const VoterBackground = styled.div`
	max-height: 500px;
	overflow-y: scroll;
	margin-bottom: 16px;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 15px;
  margin-left: 2px;
`

const VoterRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 28px;
  
  ${({ active }) => active && `
    background-color: #E8E8E8;
  `}
`

const VoterAddress = styled.a`
  color: ${primaryColor};
  text-decoration: none;
  text-align: left;
`

const VoteCount = styled.div`
`

export default function ViewMoreVotersDialogue({ proposal, voters, onClose }) {
  return (
    <BackDrop>
      <Card>
        <Title>
          Top Voters
        </Title>
        <Underline/>
        {/*<Proposal>*/}
        {/*  {proposal.timestampFormatted()}*/}
        {/*</Proposal>*/}
        {/*<Time>*/}
        {/*  {proposal.timestampFormatted()}*/}
        {/*</Time>*/}
        <VoterBackground>
          {voters.map((voter, index) =>
            (
              <VoterRow key={`voter-${voter.walletAddress}`} active={index % 2 === 1}>
                <VoterAddress href={`https://etherscan.io/address/${voter.walletAddress}`} target={'_blank'}>
                  {shorten(voter.walletAddress)}
                  &nbsp;
                  <ExternalLink/>
                </VoterAddress>
                <VoteCount>
                  {amountFormatter(voter.proposalVoteInfo?.votesCastedBN, 18, MIN_DECIMALS, true, true)}
                </VoteCount>
              </VoterRow>)
          )}
        </VoterBackground>
        <Exit onClick={() => onClose()}>
          <img src={Close} alt={'X'}/>
        </Exit>
      </Card>
    </BackDrop>
  )
}