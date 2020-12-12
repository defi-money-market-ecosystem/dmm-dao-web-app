import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import VoteTabs from '../../components/VoteTabs/'
import TopAddresses from './TopAddresses'
import { Link, Redirect, useParams, useHistory } from 'react-router-dom'
import { useWeb3React } from '../../hooks'
import temp from '../../assets/images/dmm-logo.svg'

const Main = styled.div`
  width: 60vw;
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

const Title = styled.div`
  color: ${({ theme }) => theme.black};
  font-weight: 300;
  font-size: 25px;
  margin: 10px;
`

const Card = styled.div`
  ${({ width }) => `
    width: calc(${width}% - 20px);
  `}

  font-weight: 400;
  font-size: 18px;
  cursor: auto;
  background-color: #FFFFFF;
  border-radius: 5px;
  margin: 10px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  color: black;
  display: inline-block;
  vertical-align: top;
  padding: 20px 30px;
  -webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
  -moz-box-sizing: border-box;    /* Firefox, other Gecko */
  box-sizing: border-box;         /* Opera/IE 8+ */

  @media (max-width: 550px) {
    width: calc(100% - 20px);
  }
`

const CardTitle = styled.div`  
  font-size: 13px;
  font-weight: 300;
  color: #0a2a5a;
  padding-bottom: 5px;

  ${({ large }) => large && `
    font-size: 28px;
  `}
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const Underline = styled.div`
  height: 1px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;

  ${({ large }) => large && `
    height: 2px;
  `}
`

const Half = styled.div`
  display: inline-block;
  width: 50%;
  vertical-align: top;
`

const Bar = styled.div`
  background-color: #e2e2e2;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  margin-top: 20px;
`

const Fill = styled.div`
  background-color: ${({ theme }) => theme.primary};
  height: 100%;
  border-radius: 2px;

  ${({ width }) => `
    width: ${width}%;
  `}
`

const CustomLink = styled(Link)`
  color: ${({ theme }) => theme.primary};
  font-size: 15px;
  text-decoration: none;
  display: block;
`

const Mg = styled.div`
  margin: 10px;
`
const baseUrl = 'https://api.defimoneymarket.com'

async function getOverview() {
  // return fetch(`${baseUrl}/v1/governance/accounts/${walletAddress}`)// 0x0F9Dd46B0E1F77ceC0f66C20B9a1F56Cb34A4556
  //   .then(response => response.json())
  //   .then(response => !!response.data ? response.data : null)
  return {
    burned: 59394923,
    votes_delegated: 3901390,
    voting_addresses: 381
  }
}

export default function Overview() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({})
  const { account: walletAddress, library } = useWeb3React()
  const hu = (i) => Number(i).toLocaleString()

  useEffect(() => {
    const perform = () => {
      const overviewPromise = getOverview().then(overview => {
         setOverview(overview)
      })

      Promise.all([overviewPromise]).then(() => {
        setLoading(false)
      })
    }
    
    perform()
    const subscriptionId = setInterval(() => {
      perform()
    }, 15000)

    return () => clearInterval(subscriptionId)
  }, [walletAddress])

  return (
    <>
      <VoteTabs/>
      <Main>
        <Title>Vote Overview</Title>
        <Card width={50}>
          <Half>
            <CardTitle>DMG Burned</CardTitle>
            <Underline/>
            {hu(overview?.burned)}
          </Half>
          <Half>
            <CustomLink to={'/governance/dmg'}>
              {'View'} &#8594;
            </CustomLink>
            <Bar>
              <Fill width={73}/>
            </Bar>
          </Half>
        </Card>
        <Card width={25}>
          <CardTitle>Votes Delegated</CardTitle>
          <Underline/>
          {hu(overview?.votes_delegated)}
        </Card>
        <Card width={25}>
          <CardTitle>Voting Addresses</CardTitle>
          <Underline/>
          {hu(overview?.voting_addresses)}
        </Card>
        <Mg>
          <TopAddresses limit={5}/>
        </Mg>
        {/*temporary image and text*/}
        <Card width={100}>
          <Half>
            <CardTitle large>DMM Governance</CardTitle>
            <Underline large/>
            DeFi Money Market is managed by a decentralized community of DMG token-holders and their delegates, who propose and vote on upgrades to the protocol.
            <CustomLink onClick={() => window.open('https://medium.com/dmm-dao', '_blank')}>
              {'Learn More'} &#8594;
            </CustomLink>
          </Half>
          <Half  style={{textAlign: 'center'}}>
            <img src={temp} alt={'temp'} style={{height: '170px'}}/>
          </Half>
        </Card>
      </Main>
    </>
  )
}