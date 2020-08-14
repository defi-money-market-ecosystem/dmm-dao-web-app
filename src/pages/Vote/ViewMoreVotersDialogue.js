import React from 'react'
import Close from '../../assets/svg/close-black-18dp.svg'
import styled from 'styled-components'
import { amountFormatter, shorten } from '../../utils'

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

const TextualBody = styled.div`
	padding-top: 16px;
	padding-bottom: 16px;
	text-align: left;
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
`

const VoterAddress = styled.a`

`

const VoteCount = styled.div`
`

export default function ViewMoreVotersDialogue({ proposal, voters, onClose }) {
  return (
    <BackDrop>
      <Card>
        <Title>
          Voters
        </Title>
        <Underline/>
        {/*<Proposal>*/}
        {/*  {proposal.timestampFormatted()}*/}
        {/*</Proposal>*/}
        {/*<Time>*/}
        {/*  {proposal.timestampFormatted()}*/}
        {/*</Time>*/}
        {voters.map(voter =>
          (<VoterRow key={`voter-${voter.walletAddress}`}>
            <VoterAddress href={`https://etherscan.io/addresses/${voter.walletAddress}`}>
              {shorten(voter.walletAddress)}
            </VoterAddress>
            <VoteCount>
              {amountFormatter(voter.voteCountBN)}
            </VoteCount>
          </VoterRow>)
        )}
        <Exit onClick={() => onClose()}>
          <img src={Close} alt={'X'}/>
        </Exit>
      </Card>
    </BackDrop>
  )
}