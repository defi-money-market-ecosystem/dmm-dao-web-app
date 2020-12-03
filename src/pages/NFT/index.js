import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
  useTokenContract,
  useWeb3React
} from '../../hooks'
import Web3Status from '../../components/Web3Status'
import { ethers } from 'ethers'
import { Button } from '../../theme'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import Chart from "react-google-charts";
import { calculateGasMargin, getProviderOrSigner } from '../../utils'
import { safeAccess, isAddress, getTokenAllowance, amountFormatter } from '../../utils'
import { useAddressBalance } from '../../contexts/Balances'
import * as Sentry from '@sentry/browser/dist/index'
import { WETH_ADDRESS } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'
//import Button from '@material-ui/core/Button'

const GAS_MARGIN = ethers.BigNumber.from(1000);


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
`

const CountrySelect = styled.div`
  width: 33%;
  display: inline-block;
  vertical-align: top;
  position: relative;
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
  
  &.expanded {
    height: auto;
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
`

const SelectTypeSection = styled.div`
  text-align: center;
  width: 90%;
  padding: 0 5%;
  margin-bottom: 100px;
`

const TypeSelection = styled.div`
  text-align: center;
  width: 100%;
`

const Type = styled.div`
  width: 350px;
  height: 200px;
  max-width: 90vw;
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
  margin-top: 2 0px;
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

const PurchaseInfoField = styled.div`
  margin-bottom: 20px;
`

const PurchaseInfoFieldTitle = styled.div`
  display: inline;
  font-size: 24px;
  line-height: 30px;
  font-weight: 100;
  margin-right: 8px;
`

const PurchaseInfoFieldValue = styled.div`
  display: inline;
  font-weight: 400;
  font-size: 24px;
  line-height: 30px;
`

const PurchaseButton = styled.div`
  width: 240px;
`

const ConnectWalletButton = styled.div`
  button {
    color: white;
    width: fit-content;
    padding: 10px 25px;
    background: #327ccb;
  }
`

const getNFTData = (setConstructedCountryData, setConstructedMapData) => {
  fetch(`https://api.defimoneymarket.com/v1/asset-introducers/primary-market`)
    .then(response => response.json())
    .then(response => response["data"])
    .then(countries => {
      let constructedCountryData = [];

      for (let country in countries) {
        const country_name = countries[country]["AFFILIATE"] ? countries[country]["AFFILIATE"] && countries[country]["AFFILIATE"][0]["country_name"] : countries[country]["PRINCIPAL"] && countries[country]["PRINCIPAL"][0]["country_name"];
        const available_affiliates = countries[country]["AFFILIATE"] && countries[country]["AFFILIATE"].length;
        const available_principals = countries[country]["PRINCIPAL"] && countries[country]["PRINCIPAL"].length;
        const total_available = (available_affiliates || 0) + (available_principals || 0);
        const price_usd = countries[country]["AFFILIATE"] ? countries[country]["AFFILIATE"] && countries[country]["AFFILIATE"][0]["price_usd"] : countries[country]["PRINCIPAL"] && countries[country]["PRINCIPAL"][0]["price_usd"];
        const price_dmg = countries[country]["AFFILIATE"] ? countries[country]["AFFILIATE"] && countries[country]["AFFILIATE"][0]["price_dmg"] : countries[country]["PRINCIPAL"] && countries[country]["PRINCIPAL"][0]["price_dmg"];
        const affiliate_token_id = countries[country]["AFFILIATE"] && countries[country]["AFFILIATE"][0]["token_id"];
        const principal_token_id = countries[country]["PRINCIPAL"] && countries[country]["PRINCIPAL"][0]["token_id"];

        constructedCountryData.push({
          country: country_name,
          availableAffiliates: available_affiliates,
          availablePrincipals: available_principals,
          totalAvailable: total_available,
          priceUSD: price_usd,
          priceDMG: price_dmg,
          affiliateTokenID: affiliate_token_id,
          principalTokenID: principal_token_id

        });
      }

      setConstructedCountryData(constructedCountryData);

      let mapData = [['Country', 'Available NFTs']];

      if (constructedCountryData) {
        for (let country in constructedCountryData) {
          mapData.push([constructedCountryData[country].country, constructedCountryData[country].totalAvailable]);
        }
      }

      setConstructedMapData(mapData);

    })
};

export default function NFT({ params }) {
  const { t } = useTranslation()
  const oneWei = ethers.BigNumber.from('1000000000000000000');

  const { library, account, chainId } = useWeb3React();

  //const [isDisplayConfirmWithdraw, setIsDisplayConfirmWithdraw] = useState(false)
  const [selectedType, setSelectedType] = useState('Affiliate');
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [constructedCountryData, setConstructedCountryData] = useState(null);
  const [constructedMapData, setConstructedMapData] = useState(null);

  const DMGTokenAddress = '0xEd91879919B71bB6905f23af0A68d231EcF87b14';

  const spenderAddress = '0xc8AC9D420e960DA89Eb8f1ed736eB9ff2F0054aF';

  let tokenAllowanceSet;

  const tokenContract = useTokenContract(spenderAddress);

  if (account) {
    getTokenAllowance(account, DMGTokenAddress, spenderAddress, library).then(result => {
      tokenAllowanceSet = !result.eq(ethers.BigNumber.from(0));
    });
  }

  // Make sure the wallet has sufficient balance
  const userTokenBalance = useAddressBalance(account, DMGTokenAddress);

  const addTransaction = useTransactionAdder();

  if (!constructedCountryData) getNFTData(setConstructedCountryData, setConstructedMapData);

  return (
    <NFTWrapper>
      <TitleSection>
        <Subtitle>
          Purchase an NFT
        </Subtitle>
        <PageTitle>
          Become an Asset Introducer
        </PageTitle>
        <Underline/>
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
            {constructedCountryData && constructedCountryData.map(country =>
              (!selectedCountry || country.country !== selectedCountry.country) &&
              <CountryDropdownRow
                onClick={() => setSelectedCountry(country)}
              >
                {country.country}
              </CountryDropdownRow>
            )}
          </CountryDropdown>
          <CountryInformation>
            { selectedCountry && <div>
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
                  {selectedCountry.availableAffiliates || 0} NFT{selectedCountry.availableAffiliates && parseInt(selectedCountry.availableAffiliates) !== 1 && 's'}
                </InformationData>
              </InformationItem>
              <InformationItem>
                <InformationTitle>
                  Principals Remaining:
                </InformationTitle>
                <InformationData>
                  {selectedCountry.availablePrincipals || 0} NFT{selectedCountry.availablePrincipals && parseInt(selectedCountry.availablePrincipals) !== 1 && 's'}
                </InformationData>
              </InformationItem>
              <InformationItem>
                <InformationTitle>
                  NFT Price:
                </InformationTitle>
                <InformationData>
                  {amountFormatter(ethers.BigNumber.from(selectedCountry.priceDMG), 18, 2)} DMG
                </InformationData>
              </InformationItem>
            </div>}
          </CountryInformation>
          <ExploreLink>
            <a href="https://explorer.defimoneymarket.com/affiliates">Explore current affiliates</a>
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
            // Note: you will need to get a mapsApiKey for your project.
            // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
            mapsApiKey="YOUR_KEY_HERE"
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
            className={selectedType === 'Affiliate' ? 'active' : ''}
            onClick={() => setSelectedType('Affiliate')}
          >
            <TypeTitle>
              Affiliate
            </TypeTitle>
            <TypeBody>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute sed do eiusmod tempor incididunt ut
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
              Curently unavailable
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
      {selectedCountry && <CompletePurchaseSection>
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
              {selectedCountry.country}
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
          <PurchaseInfoField>
            <PurchaseInfoFieldTitle>
              Purchase Size:
            </PurchaseInfoFieldTitle>
            <PurchaseInfoFieldValue>
              {amountFormatter(ethers.BigNumber.from(selectedCountry.priceDMG), 18, 2)} DMG
            </PurchaseInfoFieldValue>
          </PurchaseInfoField>
          <PurchaseButton>
            {
              account ? (
                tokenAllowanceSet ? (
                  <Button>
                    Purchase
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      let estimatedGas
                      let useUserBalance = false
                      estimatedGas = await tokenContract.estimateGas
                        .approve(account, ethers.constants.MaxUint256)
                        .catch(error => {
                          console.error('Error setting max token approval ', error)
                        })
                      if (!estimatedGas) {
                        // general fallback for tokens who restrict approval amounts
                        estimatedGas = await tokenContract.estimateGas.approve(account, userTokenBalance)
                        useUserBalance = true
                      }
                      tokenContract
                        .approve(account, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                        })
                        .then(response => {
                          addTransaction(response, { approval: spenderAddress })
                        })
                        .catch(error => {
                          if (error?.code !== 4001) {
                            console.error(`Could not approve ${spenderAddress} due to error: `, error)
                            Sentry.captureException(error)
                          } else {
                            console.log('Could not approve tokens because the txn was cancelled')
                          }
                        })
                    }}
                  >
                    Unlock
                  </Button>
                )
              ) : (
                <ConnectWalletButton>
                  <Web3Status/>
                </ConnectWalletButton>
              )
            }
          </PurchaseButton>
        </CompanyFields>
      </CompletePurchaseSection>}
    </NFTWrapper>
  )

}