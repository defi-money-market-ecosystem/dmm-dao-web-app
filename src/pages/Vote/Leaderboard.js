import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import TopAddresses from './TopAddresses'
import { useWeb3React } from '../../hooks'

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
  margin: 10px 0;
`

const backLink = {
  textDecoration: 'none',
  color: '#808080',
  cursor: 'pointer',
  fontWeight: '300',
  fontSize: '15px',
}

const baseUrl = 'https://api.defimoneymarket.com'

async function getOverview() {
  // return fetch(`${baseUrl}/v1/governance/accounts/${walletAddress}`)// 0x0F9Dd46B0E1F77ceC0f66C20B9a1F56Cb34A4556
  //   .then(response => response.json())
  //   .then(response => !!response.data ? response.data : null)
  return []
}

export default function Leaderboard() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(true)
  const { account: walletAddress } = useWeb3React()

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
    <Main>
      <Link to={'/governance/overview'} style={backLink}>
        &#8592; {'Overview'}
      </Link>
      <Title>
        Vote Leaderboard
      </Title>
      <TopAddresses/>  
    </Main>
  )
}