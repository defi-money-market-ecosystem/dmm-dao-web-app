import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
  useContract,
  useInterval,
  useTokenContract,
  useWeb3React
} from '../../hooks'
import Web3Status from '../../components/Web3Status'
import { ethers } from 'ethers'
import { Button } from '../../theme'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import Chart from 'react-google-charts'
import { calculateGasMargin, DMM_API_URL, getProviderOrSigner } from '../../utils'
import { safeAccess, isAddress, getTokenAllowance, amountFormatter } from '../../utils'
import { useAddressBalance } from '../../contexts/Balances'
import * as Sentry from '@sentry/browser/dist/index'
import { DMG_ADDRESS, WETH_ADDRESS } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressAllowance } from '../../contexts/Allowances'
import { getConnectorName, getDefaultApiKeyHeaders, routes, sessionId } from '../../utils/api-signer'
//import Button from '@material-ui/core/Button'
import BUYER_ABI from '../../constants/abis/asset_introducer_buyer_router'
import STAKING_ABI from '../../constants/abis/asset_introducer_staking_router'

const GAS_MARGIN = ethers.BigNumber.from(1000)


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

const NFTWrapper = styled.div`
  width: 100vw;
  max-width: 1200px;
  font-family: 'Open Sans', sans-serif;
  color: black;
`

const TitleSection = styled.div`
  width: 70%;
  padding: 0 5%;
  color: black;
  margin-top: 25px;
`

const Subtitle = styled.div`
  font-weight: 100;
  font-size: 24px;
`

const PageTitle = styled.div`
  font-weight: 400;
  font-size: 74px;
  line-height: 80px;
  margin-left: -5px;
  
  @media (max-width: 822px) {
    font-size: 9vw;
    line-height: 12vw;
  }
`

const Underline = styled.div`
  height: 7px;
  width: 20%;
  background-color: #327CCB;
  margin-top: 14px;
`

const SelectCountrySection = styled.div`
  width: 90%;
  padding: 0 5%;
  margin-top: 100px;
  margin-bottom: 100px;
  
  @media (max-width: 850px) {
    display: flex;
    justify-content: space-between;
    flex-direction: column-reverse;
    margin-top: 0;
  }
`

const CountrySelect = styled.div`
  width: 33%;
  display: inline-block;
  vertical-align: top;
  position: relative;
  
  @media (max-width: 850px) {
    width: 100%;
  }
`

const SectionTitle = styled.div`
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 5px;
  text-align: left;
`

const CountryDropdown = styled.div`
  height: 30px;
  width: 200px;
  overflow: hidden;
  border-radius: 5px;
  background-color: #FFFFFF;
  cursor: pointer;
  color: #0A2A5A;/*#8B9EB2;*/
  font-size: 16px;
  line-height: 30px;
  font-weight: 100;
  padding: 0 12px;
  margin-bottom: 20px;
  position: absolute;
  z-index: 100;
  
  &.expanded {
    height: auto;
    z-index: 200;
  }
`

const CountryDropdownIcon = styled.div`
  color: #DEEEFE;
  font-size: 10px;
  float: right;
  margin-right: 2px;
  transform: scaleY(0.8);
  
  &.flipped {
    transform: rotate(180deg);
  }
`

const CountryDropdownRow = styled.div`
  height: 30px;
  line-height: 30px;
  width: 100%;
`

const CountryInformation = styled.div`
  width: 100%;
  margin-top: 50px;
`

const InformationItem = styled.div`
  font-size: 22px;
  margin-bottom: 10px;
`

const InformationTitle = styled.div`
  display: inline;
  font-weight: 100;
  margin-right: 8px;
`

const InformationData = styled.div`
  display: inline;
  font-weight: 400;
`

const ExploreLink = styled.div`
  a {
    color: #327CCB;
    font-size: 16px;
    font-weight: 300;
    text-decoration: none;
  }
`

const Map = styled.div`
  display: inline-block;
  vertical-align: top;
  width: 67%;
  margin-top: -40px;
  
  div > div > div > div > div > svg > g > rect {
    fill: none;
  }
  
  @media (max-width: 850px) {
    width: 100%;
  }
`

const SelectTypeSection = styled.div`
  text-align: center;
  width: 90%;
  padding: 0 5%;
  margin-bottom: 100px;
  
  @media (max-width: 600px) {
    margin-bottom: 40px;
  }
`

const TypeSelection = styled.div`
  text-align: center;
  width: 100%;
`

const Type = styled.div`
  width: 350px;
  height: 200px;
  max-width: 67vw;
  border-radius: 5px;
  cursor: pointer
  background: white;
  color: #0A2A5A;
  text-align: left;
  padding: 25px 30px;
  display: inline-block;
  vertical-align: top;
  margin: 15px;
  transition: all 0.2s ease-in-out;
  
  @media (max-width: 600px) {
    height: 220px;
  }
  
  a {
    text-decoration: none;
    font-weight: 700;
    color: inherit;
  }
  
  :hover {
    box-shadow: rgba(0,0,0,0.5) 1px 1px 8px -4px, rgba(0,0,0,0.5) 1px 1px 4px -4px; 
  }
  
  &.disabled {
    cursor: default;
    click-events: none;
    opacity: 0.5;
  }
  
  &.active {
    background-color: #327CCB;
    color: white;
    box-shadow: rgba(0,0,0,0.5) 1px 1px 8px -4px, rgba(0,0,0,0.5) 1px 1px 4px -4px; 
  }
`

const TypeTitle = styled.div`
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
`

const TypeBody = styled.div`
  font-size: 15px;
  font-weight: 100;
  line-height: 22px;
`

const CompanyInfoSection = styled.div`
  width: 90%;
  padding: 0 5%;
  margin-bottom: 100px;
`

const CompanyTitle = styled.div`
  width: 50%;
  display: inline-block;
  vertical-align: top;
  padding: 80px 0;
  
  @media (max-width: 600px) {
    width: 100%;
    padding-bottom: 30px;
  }
`

const SectionSubtitle = styled.div`
  color: #327CCB;
  font-weight: 100;
  font-size: 20px;
`

const CompanyFields = styled.div`
  width: 50%;
  display: inline-block;
  vertical-align: top;
  margin-top: 20px;
  
  @media (max-width: 600px) {
    width: 100%;
  }
`

const CompanyName = styled.div`
  margin-bottom: 25px;
`

const FieldTitle = styled.div`
  font-size: 20px;
  color: #0A2A5A;
  font-weight: 600;
`

const CompanyDetails = styled.div`
  margin-bottom: 25px;
`

const FieldInputSmall = styled.div`
  margin-top: 8px;
  
  input {
    border: none;
    border-radius: 5px;
    padding: 6px 12px;
    font-family: 'Open Sans', sans-serif;
    color: black;
    font-size: 15px;
  }
  
  input:focus {
    outline: none;
  }
`

const FieldInputLarge = styled.div`
  margin-top: 8px;
  
  textarea {
    border: none;
    border-radius: 5px;
    padding: 6px 12px;
    font-family: 'Open Sans', sans-serif;
    color: black;
    font-size: 15px;
    width: 70%;
    height: 100px;
  }
  
  textarea:focus {
    outline: none;
  }
`

const CompanyWebsite = styled.div`
  margin-bottom: 10px;
`

const CompletePurchaseSection = styled.div`
  margin-bottom: 250px;
  padding: 0 5%;
`

const LockupInfoField = styled.div`
  width: fit-content;
  display: inline-block;
  width: 100%;
  margin-bottom: 5px;
  margin-top: 10px;
`

const LockupInfoFieldTitle = styled.div`
  font-weight: 600;
  margin-right: 8px;
  font-size: 14px;
  line-height: 22px;
`

const LockupInfoFieldValue = styled.div`
  font-weight: 100;
  line-height: 24px;
  font-size: 20px;
`

const PurchaseInfoField = styled.div`
  width: fit-content;
  display: inline-block;
  margin-bottom: 15px;
  
  :first-of-type {
    margin-right: 20px;
  }
`

const PurchaseInfoFieldTitle = styled.div`
  font-size: 18px;
  line-height: 30px;
  font-weight: 600;
  margin-right: 8px;
`

const PurchaseInfoFieldValue = styled.div`
  font-weight: 100;
  font-size: 28px;
  line-height: 30px;
`

const StakeCheckboxWrapper = styled.div`
  width: 100%;
  margin-bottom: 12px;
`

const StakeCheckbox = styled.div`
  width: 12px;
  height: 12px;
  margin-top: 5px;
  background-color: white;
  /*border: 1px solid #327CCB;*/
  display: inline-block;
  margin-right: 5px;
  border-radius: 3px;
  cursor: pointer;
  
  :hover {
    border: 1px solid #327CCB;
    height: 10px;
    width: 10px;
  }
  
  &.selected {
    background-color: #70a2d6;
    border: 1px solid white;
    height: 10px;
    width: 10px;
    
    :hover {
      
    }
  }
`

const StakeTitle = styled.div`
  display: inline-block;
  vertical-align: top;
  font-size: 16px;
  font-weight: 100;
`

const StakingInfoSection = styled.div`
  width: 95%;
  margin-bottom: 12px;
  margin-left: 5%;
`

const StakingInfoTitle = styled.div`
  
`

const StakingSelectSection = styled.div`
  width: 100%;
  margin-bottom: 50px;
  position: relative;
`

const PurchaseButton = styled.div`
  width: 240px;
`

const getNFTData = (setConstructedCountryData, setConstructedMapData, setSelectedStakingToken, setSelectedStakingPeriod) => {
  fetch(`${DMM_API_URL}/v1/asset-introducers/primary-market`)
    .then(response => response.json())
    .then(response => response['data'])
    .then(countries => {
      let constructedCountryData = []

      for (let country in countries) {
        const introducers = countries[country]['introducer_type']
        if (introducers) {
          const affiliate = 'AFFILIATE'
          const principal = 'PRINCIPAL'

          const country_name = countries[country]['country_name']
          const available_affiliates = introducers[affiliate] ? introducers[affiliate]['token_ids'].length : 0
          const available_principals = introducers[principal] ? introducers[principal]['token_ids'].length : 0
          const total_available = (available_affiliates || 0) + (available_principals || 0)
          const price_affiliate_usd = introducers[affiliate] ? introducers[affiliate]['price_usd'] : null
          const price_affiliate_dmg = introducers[affiliate] ? introducers[affiliate]['price_dmg'] : null
          const price_principal_usd = introducers[principal] ? introducers[principal]['price_usd'] : null
          const price_principal_dmg = introducers[principal] ? introducers[principal]['price_dmg'] : null
          const affiliate_token_id = introducers[affiliate] && introducers[affiliate]['token_ids'][0]
          const principal_token_id = introducers[principal] && introducers[principal]['token_ids'][0]
          const affiliate_staking_data = introducers[affiliate] ? introducers[affiliate]['staking_prices'] : {}
          const principal_staking_data = introducers[principal] ? introducers[principal]['staking_prices'] : {}

          constructedCountryData.push({
            country: country_name,
            availableAffiliates: available_affiliates,
            availablePrincipals: available_principals,
            totalAvailable: total_available,
            priceAffiliateUSD: price_affiliate_usd,
            priceAffiliateDMG: price_affiliate_dmg,
            pricePrincipalUSD: price_principal_usd,
            pricePrincipalDMG: price_principal_dmg,
            affiliateTokenID: affiliate_token_id,
            principalTokenID: principal_token_id,
            stakingDataAffiliate: affiliate_staking_data,
            stakingDataPrincipal: principal_staking_data
          })
        }
      }

      setConstructedCountryData(constructedCountryData)

      // --- Staking ---
      let stakingPeriods = [] // {'period', 'duration_months'} -> {'TWELVE_MONTHS', 12}

      if (constructedCountryData && constructedCountryData[0]) {
        const stakingData = constructedCountryData[0].availableAffiliates > 0 ? constructedCountryData[0].stakingDataAffiliate : constructedCountryData[0].stakingDataPrincipal
        for (let period in stakingData) {
          stakingPeriods.push(stakingData[period]['staking_period'])
        }
      }

      setSelectedStakingPeriod(stakingPeriods[0] ? stakingPeriods[0] : '')

      let stakingTokens = []

      if (constructedCountryData && constructedCountryData[0]) {
        const stakingData = constructedCountryData[0].availableAffiliates > 0 ? constructedCountryData[0].stakingDataAffiliate : constructedCountryData[0].stakingDataPrincipal
        for (let token in stakingData[stakingPeriods[0]['period']]['staking_amounts']) {
          stakingTokens.push(stakingData[stakingPeriods[0]['period']]['staking_amounts'][token]['m_token']['symbol'])
        }
      }

      setSelectedStakingToken(stakingTokens[0] || '')

      let mapData = [['Country', 'Available NFTs']]

      if (constructedCountryData) {
        for (let country in constructedCountryData) {
          mapData.push([constructedCountryData[country].country, constructedCountryData[country].totalAvailable])
        }
      }

      setConstructedMapData(mapData)

    })
}

const ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS = '0xc8AC9D420e960DA89Eb8f1ed736eB9ff2F0054aF'
const ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS = '0x2bd086E46af30eDb0039b6b0B528F8218151c898'

export default function NFT({ params }) {
  const { t } = useTranslation()
  const oneWei = ethers.BigNumber.from('1000000000000000000')

  const { library, account, chainId } = useWeb3React()

  //const [isDisplayConfirmWithdraw, setIsDisplayConfirmWithdraw] = useState(false)
  const [selectedType, setSelectedType] = useState('Affiliate')
  const [dropdownExpanded, setDropdownExpanded] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [constructedCountryData, setConstructedCountryData] = useState(null)
  const [constructedMapData, setConstructedMapData] = useState(null)
  const [stakingSelected, setStakingSelected] = useState(false)
  const [mTokenDropdownExpanded, setmTokenDropdownExpanded] = useState(false)
  const [periodDropdownExpanded, setPeriodDropdownExpanded] = useState(false)

  const tokenContract = useTokenContract(DMG_ADDRESS)

  const allowance = useAddressAllowance(account, DMG_ADDRESS, stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS)
  const dmgAllowanceSet = !!allowance && allowance.gt(ethers.BigNumber.from('0'))

  // Make sure the wallet has sufficient balance
  const userTokenBalance = useAddressBalance(account, DMG_ADDRESS)

  const addTransaction = useTransactionAdder()

  const [selectedStakingToken, setSelectedStakingToken] = useState('')
  const [selectedStakingPeriod, setSelectedStakingPeriod] = useState({})

  useInterval(() => {
    getNFTData(setConstructedCountryData, setConstructedMapData, setSelectedStakingToken, setSelectedStakingPeriod)
  }, 5000, true)

  let stakingPeriods = [] // {'period', 'duration_months'} -> {'TWELVE_MONTHS', 12}

  if (constructedCountryData && constructedCountryData[0]) {
    const stakingData = constructedCountryData[0].availableAffiliates > 0 ? constructedCountryData[0].stakingDataAffiliate : constructedCountryData[0].stakingDataPrincipal
    for (let period in stakingData) {
      if (stakingData.hasOwnProperty(period)) {
        stakingPeriods.push(stakingData[period]['staking_period'])
      }
    }
  }

  let stakingTokens = []

  if (constructedCountryData && constructedCountryData[0]) {
    const stakingData = constructedCountryData[0].availableAffiliates > 0 ? constructedCountryData[0].stakingDataAffiliate : constructedCountryData[0].stakingDataPrincipal
    for (let token in stakingData[stakingPeriods[0]['period']]['staking_amounts']) {
      stakingTokens.push(stakingData[stakingPeriods[0]['period']]['staking_amounts'][token]['m_token']['symbol'])
    }
  }

  const lockupAmount = selectedCountry && stakingSelected && (selectedType === 'Affiliate' ? selectedCountry.stakingDataAffiliate[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token_amount_wei'] : selectedCountry.stakingDataPrincipal[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token_amount_wei'])
  const stakingPurchaseSize = selectedCountry && stakingSelected && (selectedType === 'Affiliate' ? selectedCountry.stakingDataAffiliate[selectedStakingPeriod['period']]['price_dmg'] : selectedCountry.stakingDataPrincipal[selectedStakingPeriod['period']]['price_dmg'])
  const stakingTokenAddress = selectedCountry && stakingSelected && (selectedType === 'Affiliate' ? selectedCountry.stakingDataAffiliate[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['dmm_token_address'] : selectedCountry.stakingDataPrincipal[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['dmm_token_address'])
  const stakingTokenDecimals = selectedCountry && stakingSelected && (selectedType === 'Affiliate' ? selectedCountry.stakingDataAffiliate[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['decimals'] : selectedCountry.stakingDataPrincipal[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['decimals'])

  const stakingAllowance = useAddressAllowance(account, stakingTokenAddress, ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS)
  const stakingTokenAllowanceSet = selectedCountry && stakingSelected && allowance && allowance.gt(ethers.BigNumber.from('0'))
  const stakingTokenContract = useTokenContract(stakingTokenAddress)
  const stakingTokenBalance = useAddressBalance(account, stakingTokenAddress)
  const stakingDmmTokenId = selectedCountry && stakingSelected && (selectedType === 'Affiliate' ? selectedCountry.stakingDataAffiliate[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['dmm_token_id'] : selectedCountry.stakingDataPrincipal[selectedStakingPeriod['period']]['staking_amounts'][selectedStakingToken]['m_token']['dmm_token_id'])

  const buyerRouter = useContract(ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS, BUYER_ABI)
  const stakingRouter = useContract(ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS, STAKING_ABI)

  const purchaseNft = async (tokenId, dmmTokenId, stakingDuration) => {
    let estimatedGas
    let stakingDurationInt
    if (stakingSelected) {
      if (stakingDuration === 'TWELVE_MONTHS') {
        stakingDurationInt = 0
      } else if (stakingDuration === 'EIGHTEEN_MONTHS') {
        stakingDurationInt = 1
      } else {
        console.error('invalid staking duration, found ', stakingDuration)
        return
      }

      estimatedGas = await stakingRouter.estimateGas
        .buyAssetIntroducerSlot(tokenId, dmmTokenId, stakingDurationInt)
        .catch(error => {
          console.error('Error estimating gas cost for buying asset introducer slot ', error)
          return ethers.BigNumber.from('1000000')
        })
    } else {
      estimatedGas = await buyerRouter.estimateGas
        .buyAssetIntroducerSlot(tokenId)
        .catch(error => {
          console.error('Error estimating gas cost for buying asset introducer slot ', error)
          return ethers.BigNumber.from('1000000')
        })
    }

    let web3Call
    if (stakingSelected) {
      web3Call = stakingRouter.buyAssetIntroducerSlot(tokenId, dmmTokenId, stakingDurationInt, { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN) })
    } else {
      web3Call = buyerRouter.buyAssetIntroducerSlot(tokenId, { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN) })
    }

    web3Call
      .then(response => {
        addTransaction(response, { approval: ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS })

        const body = {
          wallet_address: account,
          company_name: 'DMMF',
          company_description: null,
          company_website_url: null
        }
        const options = {
          method: 'POST',
          headers: getDefaultApiKeyHeaders(),
          body: JSON.stringify(body)
        }
        fetch(`${DMM_API_URL}/v1/asset-introducers/purchase`, options)
          .then(response => response.json())
          .then(response => {
            console.log('Found response ', response)
          })
          .catch(error => {
            console.error('Could not submit data due to error ', error)
          })

      })
      .catch(error => {
        if (error?.code !== 4001) {
          console.error(`Could not purchase NFT ${stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS} due to error: `, error)
          Sentry.captureException(error)
        } else {
          console.log('Could not purchase NFT because the txn was cancelled')
        }
      })
  }

  return (
    <NFTWrapper>
      <TitleSection>
        <Subtitle>
          Purchase an NFT
        </Subtitle>
        <PageTitle>
          Become an Asset Introducer
        </PageTitle>
        <Underline />
      </TitleSection>
      <SelectCountrySection>
        <CountrySelect>
          <SectionTitle>
            Select Country
          </SectionTitle>
          <CountryDropdown
            className={dropdownExpanded ? 'expanded' : ''}
            onClick={() => setDropdownExpanded(!dropdownExpanded)}
          >
            <CountryDropdownIcon
              className={dropdownExpanded ? 'flipped' : ''}
            >
              ▼
            </CountryDropdownIcon>
            <CountryDropdownRow>
              {selectedCountry ? (selectedCountry.country) : 'Select...'}
            </CountryDropdownRow>
            {constructedCountryData && constructedCountryData.length === 0 ? (
              <CountryDropdownRow>
                No countries available
              </CountryDropdownRow>
            ) : (
              constructedCountryData && constructedCountryData.map(country =>
                (!selectedCountry || country.country !== selectedCountry.country) &&
                <CountryDropdownRow
                  onClick={() => setSelectedCountry(country)}
                >
                  {country.country}
                </CountryDropdownRow>
              )
            )}
          </CountryDropdown>
          <CountryInformation>
            {selectedCountry && <div>
              <InformationItem>
                <InformationTitle>
                  Country:
                </InformationTitle>
                <InformationData>
                  {selectedCountry.country}
                </InformationData>
              </InformationItem>
              <InformationItem>
                <InformationTitle>
                  Affiliates Remaining:
                </InformationTitle>
                <InformationData>
                  {selectedCountry.availableAffiliates || 0} NFT{selectedCountry && selectedCountry.availableAffiliates !== 1 ? 's' : ''}
                </InformationData>
              </InformationItem>
              {selectedCountry.availableAffiliates > 0 &&
              <InformationItem>
                <InformationTitle>
                  Affiliate NFT Price:
                </InformationTitle>
                <InformationData>
                  {amountFormatter(ethers.BigNumber.from(selectedCountry.priceAffiliateDMG), 18, 2, true, true)} DMG
                </InformationData>
              </InformationItem>
              }
              <InformationItem>
                <InformationTitle>
                  Principals Remaining:
                </InformationTitle>
                <InformationData>
                  {selectedCountry.availablePrincipals || 0} NFT{selectedCountry && selectedCountry.availablePrincipals !== 1 ? 's' : ''}
                </InformationData>
              </InformationItem>
              {selectedCountry.availablePrincipals > 0 &&
              <InformationItem>
                <InformationTitle>
                  Principal NFT Price:
                </InformationTitle>
                <InformationData>
                  {amountFormatter(ethers.BigNumber.from(selectedCountry.pricePrincipalDMG), 18, 2, true, true)} DMG
                </InformationData>
              </InformationItem>
              }
            </div>}
          </CountryInformation>
          <ExploreLink>
            <a href="https://explorer.defimoneymarket.com/asset-introducers">Explore current asset introducers</a>
          </ExploreLink>
        </CountrySelect>
        <Map>
          <Chart
            width={'100%'}
            height={'420px'}
            fill={'none'}
            chartType="GeoChart"
            data={constructedMapData}
            options={{
              colorAxis: { colors: ['#6d9ed2', '#327CCB'] },
              legend: 'none'
            }}
            mapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            rootProps={{ 'data-testid': '1' }}
          />
        </Map>
      </SelectCountrySection>
      <SelectTypeSection>
        <SectionTitle>
          Select Type
        </SectionTitle>
        <TypeSelection>
          <Type
            className={!selectedCountry || selectedCountry.availableAffiliates > 0 ? (selectedType === 'Affiliate' ? 'active' : '') : 'disabled'}
            onClick={() => setSelectedType('Affiliate')}
          >
            <TypeTitle>
              Affiliate
            </TypeTitle>
            <TypeBody>
              Affiliates are the base level asset introducer in the DMM Ecosystem. They are able to charge and set
              their own origination fees as well as receive a slight percentage on the derived income payment
              production. For more information, click <a
              href="https://medium.com/dmm-dao/introducing-the-first-affiliate-member-and-nfts-into-the-dmm-dao-4392cf3f26d8"
              target='_blank' rel='noopener noreferrer'>here</a>.
            </TypeBody>
          </Type>
          <Type
            className={`disabled ${selectedType === 'Principal' ? 'active' : ''}`}
            onClick={() => {
            }/*setSelectedType('Principal')*/}
          >
            <TypeTitle>
              Principal
            </TypeTitle>
            <TypeBody>
              Currently unavailable
            </TypeBody>
          </Type>
        </TypeSelection>
      </SelectTypeSection>
      <CompanyInfoSection>
        <CompanyTitle>
          <SectionTitle>
            Company Information
          </SectionTitle>
          <SectionSubtitle>
            Optional
          </SectionSubtitle>
        </CompanyTitle>
        <CompanyFields>
          <CompanyName>
            <FieldTitle>
              Company Name
            </FieldTitle>
            <FieldInputSmall>
              <input
                type={'text'}
              />
            </FieldInputSmall>
          </CompanyName>
          <CompanyDetails>
            <FieldTitle>
              Company Details
            </FieldTitle>
            <FieldInputLarge>
              <textarea
              />
            </FieldInputLarge>
          </CompanyDetails>
          <CompanyWebsite>
            <FieldTitle>
              Website
            </FieldTitle>
            <FieldInputSmall>
              <input
                type={'text'}
                placeholder={'https://'}
              />
            </FieldInputSmall>
          </CompanyWebsite>
        </CompanyFields>
      </CompanyInfoSection>
      {(true || selectedCountry) && <CompletePurchaseSection>{/* TODO*/}
        <CompanyTitle>
          <SectionTitle>
            Complete Purchase
          </SectionTitle>
        </CompanyTitle>
        <CompanyFields>
          <PurchaseInfoField>
            <PurchaseInfoFieldTitle>
              Country:
            </PurchaseInfoFieldTitle>
            <PurchaseInfoFieldValue>
              Argentina{/*selectedCountry && selectedCountry.country TODO*/}
            </PurchaseInfoFieldValue>
          </PurchaseInfoField>
          <PurchaseInfoField>
            <PurchaseInfoFieldTitle>
              Type:
            </PurchaseInfoFieldTitle>
            <PurchaseInfoFieldValue>
              {selectedType}
            </PurchaseInfoFieldValue>
          </PurchaseInfoField>
          <StakeCheckboxWrapper>
            <StakeCheckbox
              className={stakingSelected ? 'selected' : ''}
              onClick={() => setStakingSelected(!stakingSelected)}
            />
            <StakeTitle>
              Stake mTokens for discounted purchase
            </StakeTitle>
          </StakeCheckboxWrapper>
          {(true || stakingSelected) /* TODOO */ &&
          <StakingInfoSection>
            <StakingSelectSection>
              <StakingInfoTitle>
                Select mToken to lock up:
              </StakingInfoTitle>
              <CountryDropdown
                className={mTokenDropdownExpanded ? 'expanded' : ''}
                onClick={() => setmTokenDropdownExpanded(!mTokenDropdownExpanded)}
              >
                <CountryDropdownIcon
                  className={mTokenDropdownExpanded ? 'flipped' : ''}
                >
                  ▼
                </CountryDropdownIcon>
                {true || selectedStakingToken /* TODO */ ? (
                  <CountryDropdownRow>
                    mUSDC{/*selectedStakingToken TODO*/}
                  </CountryDropdownRow>
                ) : (
                  <CountryDropdownRow>
                    Select...
                  </CountryDropdownRow>
                )}
                {stakingTokens.map(token =>
                  token !== selectedStakingToken &&
                  <CountryDropdownRow
                    onClick={() => setSelectedStakingToken(token)}
                  >
                    {token}
                  </CountryDropdownRow>
                )}
              </CountryDropdown>
            </StakingSelectSection>
            <StakingSelectSection>
              <StakingInfoTitle>
                Select lockup period:
              </StakingInfoTitle>
              <CountryDropdown
                className={periodDropdownExpanded ? 'expanded' : ''}
                onClick={() => setPeriodDropdownExpanded(!periodDropdownExpanded)}
              >
                <CountryDropdownIcon
                  className={periodDropdownExpanded ? 'flipped' : ''}
                >
                  ▼
                </CountryDropdownIcon>
                {true || selectedStakingPeriod /* TODO */ ? (
                  <CountryDropdownRow>
                    12{/*selectedStakingPeriod['duration_months'] TODO */} months
                  </CountryDropdownRow>
                ) : (
                  <CountryDropdownRow>
                    Select...
                  </CountryDropdownRow>
                )}
                {stakingPeriods.map(period =>
                  period !== selectedStakingPeriod &&
                  <CountryDropdownRow
                    onClick={() => setSelectedStakingPeriod(period)}
                  >
                    {period['duration_months']} months
                  </CountryDropdownRow>
                )}
              </CountryDropdown>
            </StakingSelectSection>
          </StakingInfoSection>
          }
          {stakingSelected &&
          <LockupInfoField>
            <LockupInfoFieldTitle>
              Lockup Size:
            </LockupInfoFieldTitle>
            <LockupInfoFieldValue>
              {/*amountFormatter(ethers.BigNumber.from(lockupAmount), stakingTokenDecimals, 2, false, true) TODO*/}100,000
              mUSDC{/*selectedStakingToken*/}
            </LockupInfoFieldValue>
          </LockupInfoField>
          }
          <PurchaseInfoField>
            <PurchaseInfoFieldTitle>
              Purchase Size:
            </PurchaseInfoFieldTitle>
            <PurchaseInfoFieldValue>
              {/*amountFormatter(ethers.BigNumber.from(stakingSelected ? stakingPurchaseSize : (selectedType === 'Affiliate' ? selectedCountry.priceAffiliateDMG : selectedCountry.pricePrincipalDMG)), 18, 2, false, true) TODO */}175,009
              DMG
            </PurchaseInfoFieldValue>
          </PurchaseInfoField>
          <PurchaseButton>
            <Button>
              Purchase
            </Button>
            {/*
              account ? (
                !stakingSelected || !stakingTokenBalance || stakingTokenBalance.gte(ethers.BigNumber.from(lockupAmount)) ? (
                  userTokenBalance.gte(ethers.BigNumber.from(stakingSelected ? stakingPurchaseSize : (selectedType === 'Affiliate' ? selectedCountry.priceAffiliateDMG : selectedCountry.pricePrincipalDMG))) ? (
                    !stakingSelected || stakingTokenAllowanceSet ? (
                      dmgAllowanceSet ? (
                        <Button
                          onClick={() => purchaseNft(selectedType === 'Affiliate' ? selectedCountry.affiliateTokenID : selectedCountry.principalTokenID, stakingDmmTokenId, selectedStakingPeriod['period'])}>
                          Purchase
                        </Button>
                      ) : (
                        <Button
                          onClick={async () => {
                            let estimatedGas
                            let useUserBalance = false
                            estimatedGas = await tokenContract.estimateGas
                              .approve(stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS, ethers.constants.MaxUint256)
                              .catch(error => {
                                console.error('Error setting max token approval ', error)
                              })
                            if (!estimatedGas) {
                              // general fallback for tokens who restrict approval amounts
                              estimatedGas = await tokenContract.estimateGas.approve(stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS, userTokenBalance)
                              useUserBalance = true
                            }
                            tokenContract
                              .approve(stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                                gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                              })
                              .then(response => {
                                addTransaction(response, { approval: stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS })
                              })
                              .catch(error => {
                                if (error?.code !== 4001) {
                                  console.error(`Could not approve ${stakingSelected ? ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS : ASSET_INTRODUCER_BUYER_ROUTER_ADDRESS} due to error: `, error)
                                  Sentry.captureException(error)
                                } else {
                                  console.log('Could not approve tokens because the txn was cancelled')
                                }
                              })
                          }}
                        >
                          Unlock DMG
                        </Button>
                      )
                    ) : (
                      <Button
                        onClick={async () => {
                          let estimatedGas
                          let useUserBalance = false
                          //TODO - replace tokenContract with tokenTokenContract
                          estimatedGas = await stakingTokenContract.estimateGas
                            .approve(ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS, ethers.constants.MaxUint256)
                            .catch(error => {
                              console.error('Error setting max token approval ', error)
                            })
                          if (!estimatedGas) {
                            // general fallback for tokens who restrict approval amounts
                            estimatedGas = await stakingTokenContract.estimateGas.approve(ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS, stakingTokenBalance)
                            useUserBalance = true
                          }
                          stakingTokenContract
                            .approve(ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS, useUserBalance ? stakingTokenBalance : ethers.constants.MaxUint256, {
                              gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                            })
                            .then(response => {
                              addTransaction(response, { approval: ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS })
                            })
                            .catch(error => {
                              if (error?.code !== 4001) {
                                console.error(`Could not approve ${ASSET_INTRODUCER_STAKING_ROUTER_ADDRESS} due to error: `, error)
                                Sentry.captureException(error)
                              } else {
                                console.log('Could not approve tokens because the txn was cancelled')
                              }
                            })
                        }}
                      >
                        Unlock {selectedStakingToken}
                      </Button>
                    )
                  ) : (
                    <Button
                      disabled
                    >
                      Insufficient DMG
                    </Button>
                  )
                ) : (
                  <Button
                    disabled
                  >
                    Insufficient {selectedStakingToken}
                  </Button>
                )
              ) : (
                <ConnectWalletButton>
                  <Web3Status />
                </ConnectWalletButton>
              )
            */}
          </PurchaseButton>
        </CompanyFields>
      </CompletePurchaseSection>}
    </NFTWrapper>
  )

}