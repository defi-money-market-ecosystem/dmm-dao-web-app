import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useWeb3React } from '../../hooks'

const Card = styled.div`
  background-color: #FFFFFF;
  width: 100%;
  border-radius: 5px;
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

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 8px;
  margin-left: 30px;
`

const Leaderboard = styled.div`
  width: 100%;
  height: auto;
`

const Address = styled.div`
  float: left;
  display: inline;
  padding: 20px 30px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 15px;
  font-weight: 400;
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
`

const AddressField = styled.div`
  display: inline-block;
  text-align: left;

  ${({ width }) => width && `
    width: ${width}%;
  `}

  ${({ right }) => right && `
    text-align: right;
  `}
`

const View = styled(Link)`
  text-align: center;
  transition: opacity 0.2s ease-in-out;
  cursor: pointer;
  width: 100%;

   ${({ active }) => active && `
    color: black;
  `}
  
  :hover {
    opacity: 0.7;
  }
`

const ViewText = styled.div`
  font-size: 13px;
  font-weight: 500;
  margin: 10px auto;
  color: #b0bdc5;
  width: 100%;
  text-align: center;
  display: inline-block;
`

const baseUrl = 'https://api.defimoneymarket.com'

async function getTopAddresses() {
  // return fetch(`${baseUrl}/v1/governance/accounts/)// 0x0F9Dd46B0E1F77ceC0f66C20B9a1F56Cb34A4556
  //   .then(response => response.json())
  //   .then(response => !!response.data ? response.data : null)
  return []
}

export default function TopAddresses({ limit }) {
  const [loading, setLoading] = useState(true)
  const [topAddresses, setTopAddresses] = useState([])

  const { account: walletAddress, library } = useWeb3React()
  const shorten = (a) => `${a.substring(0, 6)}...${a.substring(a.length - 4, a.length)}`
  const titles = ['Rank', 'Votes', 'Vote Weight', 'Voted']

  useEffect(() => {
    const perform = () => {
      const topAddressesPromise = getTopAddresses().then(topAddresses => {
         
      })

      Promise.all([topAddressesPromise]).then(() => {
        setLoading(false)
      })
    }

    perform()
    const subscriptionId = setInterval(() => {
      perform()
    }, 15000)

    return () => clearInterval(subscriptionId)
  }, [walletAddress])

  const show = !!limit ? topAddresses.slice(0, limit) : topAddresses
  const widths = [50, 20, 20, 10]

  return (
    <Card>
      <Title>
        Top Addresses by Voting Weight
      </Title>
      <Underline/>
      <Leaderboard>
        <Address>
          {titles.map((title, i) => (
            <AddressField width={widths[i]} right={!!i}>{title}</AddressField>
          ))}
        </Address>
        {show?.map(({name, address, votes, vote_weight, proposals_voted}) => {
          const display = name | shorten(address)
          const account = [display, votes, vote_weight, proposals_voted]
          return (
            <Address active={true}>
              {account.map((field, i) => (
                <AddressField width={widths[i]} right={!!i}>{field}</AddressField>
              ))}
            </Address>
          )
        })}
      </Leaderboard>
      {!!limit ? (
        <View to={'/governance/leaderboard'}>
          <ViewText>
            {'View Leaderboard'}
          </ViewText>
        </View>
      ) : null}
    </Card>
  )
}