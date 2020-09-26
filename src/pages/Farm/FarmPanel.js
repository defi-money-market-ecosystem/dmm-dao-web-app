import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
  useExchangeContract,
  useInterval,
  useWeb3React,
  useYieldFarmingProxyContract,
  useYieldFarmingRouterContract
} from '../../hooks'
import {
  ALL_TOKENS_CONTEXT,
  CURRENCY_A,
  CURRENCY_B,
  DECIMALS,
  ETH,
  ETH_ADDRESS,
  EXCHANGE_ADDRESS,
  LINK_ADDRESS,
  M_USDC_ADDRESS,
  SYMBOL,
  USDC_ADDRESS,
  useAllYieldFarmingTokens,
  WETH_ADDRESS,
  YIELD_FARMING_TOKENS_MAP
} from '../../contexts/Tokens'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { amountFormatter, calculateGasMargin, DMM_API_URL, isAddress, MIN_DECIMALS } from '../../utils'
import { ethers } from 'ethers'
import OversizedPanel from '../../components/OversizedPanel'
import { Button } from '../../theme'
import { useAddressBalance } from '../../contexts/Balances'
import styled from 'styled-components'
import { ReactComponent as Plus } from '../../assets/images/plus-blue.svg'
import {
  useIsYieldFarmingActive,
  YIELD_FARMING_PROXY_ADDRESS,
  YIELD_FARMING_ROUTER_ADDRESS
} from '../../contexts/YieldFarming'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useTranslation } from 'react-i18next'
import TransactionDetails from '../../components/TransactionDetails'
import * as Sentry from '@sentry/browser'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressYieldFarmingBalance } from '../../contexts/YieldFarmingBalances'
import { useAddressDmgRewardBalance } from '../../contexts/DmgRewardBalances'


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

const FarmingWrapper = styled.div`
  width: calc(150% + 25px);
  display: flex;
  justify-content: space-between;
  
  @media (max-width: 900px) {
    flex-direction: column;
    width: 100%;
    overflow-y: scroll;
    height: calc(100vh - 194px);
  }
`

const InfoPanel = styled.div`
  width: calc(40% - 92.5px);
  background: white;
  border-radius: 5px;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  margin-top: 32px;
  padding: 0 40px 30px;
  height: fit-content;
  opacity: ${props => props.disabled ? '0.35' : '1'}
  
  @media (max-width: 900px) {
    width: calc(100% - 80px);
  }
`

const Title = styled.div`
  font-size: 28px;
  font-weight: 300;
  color: #0a2a5a;
  padding: 20px 0 10px;
  margin-top: 10px;
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const CardTitle = styled.div`
  font-size: 28px;
  font-weight: 300;
  color: #0a2a5a;
  padding: 10px 0 10px;
  margin-top: 0;
  
  @media (max-width: 800px) {
    font-size: 23px;
  }
`

const CardText = styled.div`
  font-size: 16px;
  font-weight: 300;
  text-align: left;
  margin-top: 10px;
`

const Underline = styled.div`
  height: 2px;
  background: #327ccb;
  width: 50px;
  margin-bottom: 12px;
`

const Amount = styled.div`
  margin-top: 12px;
  margin-bottom: 2px;
  width: 100%;
`

const InlineAmount = styled.div`
  display: inline-block;
  vertical-align: top;
  width: 50%;
  margin-top: 12px;
`

const Label = styled.div`
  font-size: 14px;
  font-weight: 200;
  color: black;
  opacity: 0.8;
`

const Value = styled.div`
  font-size: 18px;
  font-weight: 300;
  color: black;
  margin-top: 4px;
`

const Wrapper = styled.div`
  width: calc(60% - 12.5px);
  margin-top: 32px;
  opacity: ${props => props.disabled ? '0.35' : '1'}
  
  @media (max-width: 900px) {
    width: 100%;
  }
`

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const ConfirmButtonsWrapper = styled.div`
  text-align: right;
  
  Button {
    display: inline-block;
    width: 100px;
    padding: 10px 20px;
    margin: 20px 0 20px 10px;
  }
  
  Button:first-of-type {
    background-color: #b1becc;
  }
`

const WrappedPlus = ({ isError, highSlippageWarning, ...rest }) => <Plus {...rest} />

const OverlayContent = styled.div`
    width: 580px;
    font-family: 'Open Sans', sans-serif;
    font-size: 18px;
    font-weight: 100;
    text-align: left;
    margin: 0 auto;
    margin-top: 60px;
    background: white;
    border-radius: 5px;
    padding: 30px 40px;
    color: black;
    position: fixed;
    z-index: 999;
    margin-left: -330px;
    left: 50%;
    
    @media (max-width: 700px) {
      max-width: calc(90vw - 80px);
      left: 5vw;
      right: 5vw;
      margin-left: 0;
      margin-right: 0;
    }
    
    @media (max-width: 450px) {
      font-size: 15px;
      margin-top: 30px;
    }
    
    @media (max-width: 350px) {
      margin-top: 0;
      font-size: 14px;
    }
`

const OverlayAcceptButton = styled.div`
  margin: 0 auto;
  margin-top: 40px;
  width: 200px;
`

const ColoredWrappedPlus = styled(WrappedPlus)`
  width: 0.625rem;
  height: 0.625rem;
  position: relative;
  padding: 0.875rem;
  path {
    stroke: ${({ active, theme }) => (active ? theme.royalBlue : theme.chaliceGray)};
  }
`

const SummaryPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 1rem 0;
  background: white;
  border-radius: 5px;
  margin-top: 15px;
  color: black;
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  
  span {
    color: black;
  }
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: black;
`

const CurrencySwitcher = styled.span`
  cursor: pointer;
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 5px 2rem 2rem 2rem;

  button {
    max-width: 20rem;
    margin-left: 8px;
    margin-right: 8px;
  }

  svg {
    color: white !important;
  }
`

const INDEPENDENT_CURRENCY_A = 0
const INDEPENDENT_CURRENCY_B = 1

const ACCEPT_FARMING_KEY = 'DMM_ACCEPT_FARMING_KEY'

const GAS_MARGIN = ethers.BigNumber.from(1000)

const FIFTEEN_MINUTES_SECONDS = (60 * 15)

// Represented as a 1e5 base number. For example, 500 == 5% (0.05)
const ALLOWED_SLIPPAGE = ethers.BigNumber.from(1000)
const SLIPPAGE_FACTOR = ethers.BigNumber.from(10000)

function getInitialSwapState(state) {
  return {
    independentValue: '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: state.exactFieldURL === 'output' ? INDEPENDENT_CURRENCY_B : INDEPENDENT_CURRENCY_A,
    currencyA: state.currencyA || M_USDC_ADDRESS,
    currencyB: state.currencyB || USDC_ADDRESS
  }
}

function farmStateReducer(state, chainId, action, currencyA) {
  switch (action.type) {
    case 'SELECT_CURRENCY': {
      const { field, currency } = action.payload

      const anyTokenPairings = [LINK_ADDRESS]

      let newCurrencyA
      if (field === INDEPENDENT_CURRENCY_A) {
        newCurrencyA = currency
      } else {
        const isSpecialToken = anyTokenPairings.indexOf(currency) !== -1
        newCurrencyA = isSpecialToken ? undefined : YIELD_FARMING_TOKENS_MAP[chainId][currency][CURRENCY_A]
      }
      let newCurrencyB
      if (field === INDEPENDENT_CURRENCY_B) {
        newCurrencyB = currency
      } else {
        const isSpecialToken = anyTokenPairings.indexOf(state[CURRENCY_B]) !== -1
        newCurrencyB = isSpecialToken ? undefined : YIELD_FARMING_TOKENS_MAP[chainId][currency][CURRENCY_B]
      }

      if (newCurrencyA === newCurrencyB) {
        return {
          ...state,
          currencyA: field === INDEPENDENT_CURRENCY_A ? currency : '',
          currencyB: field === INDEPENDENT_CURRENCY_B ? currency : ''
        }
      } else {
        return {
          ...state,
          currencyA: !!newCurrencyA ? newCurrencyA : state[CURRENCY_A],
          currencyB: !!newCurrencyB ? newCurrencyB : state[CURRENCY_B]
        }
      }
    }
    case 'UPDATE_INDEPENDENT': {
      const { field, value } = action.payload
      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value === independentValue ? dependentValue : '',
        independentField: field
      }
    }
    case 'UPDATE_DEPENDENT': {
      return {
        ...state,
        dependentValue: action.payload
      }
    }
    default: {
      return getInitialSwapState()
    }
  }
}

function calculateCurrencyBFromCurrencyA(amountA, currencyABalance, currencyBBalance) {
  return amountA
    .mul(currencyBBalance)
    .div(currencyABalance)
}

function calculateCurrencyAFromCurrencyB(amountB, currencyABalance, currencyBBalance) {
  return amountB
    .mul(currencyABalance)
    .div(currencyBBalance)
}

function getExchangeRate(inputValue, inputDecimals, outputValue, outputDecimals, invert = false) {
  try {
    if (
      inputValue &&
      (inputDecimals || inputDecimals === 0) &&
      outputValue &&
      (outputDecimals || outputDecimals === 0)
    ) {
      const factor = ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18))

      if (invert) {
        return inputValue
          .mul(factor)
          .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(outputDecimals)))
          .div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(inputDecimals)))
          .div(outputValue)
      } else {
        return outputValue
          .mul(factor)
          .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(inputDecimals)))
          .div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(outputDecimals)))
          .div(inputValue)
      }
    }
  } catch {
  }
}

function calculateMaxOutputVal(value, currency) {
  if (currency === ETH_ADDRESS) {
    const ethMinusBuffer = value.sub(ethers.BigNumber.from('100000000000000000'))
    return ethMinusBuffer.lt(ethers.constants.Zero) ? ethers.constants.Zero : ethMinusBuffer
  } else {
    return value
  }
}

function formatBalance(value) {
  return `Balance: ${value}`
}

export default function FarmPanel({ params }) {
  const { t } = useTranslation()
  const oneWei = ethers.BigNumber.from('1000000000000000000')

  const { library, account, chainId } = useWeb3React()

  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(
    localStorage.getItem(ACCEPT_FARMING_KEY) === 'true'
  )

  const yieldFarmingTokens = useAllYieldFarmingTokens()
  const mTokens = Object.entries(yieldFarmingTokens)
    .reduce((tokens, token) => {
      tokens[token[1][CURRENCY_A]] = ALL_TOKENS_CONTEXT[chainId][token[1][CURRENCY_A]]
      return tokens
    }, {})

  const underlyingTokens = Object.entries(yieldFarmingTokens)
    .reduce((tokens, token) => {
      if (token[1][CURRENCY_B] === 'ETH') {
        tokens['ETH'] = ETH['ETH']
      } else {
        tokens[token[1][CURRENCY_B]] = ALL_TOKENS_CONTEXT[chainId][token[1][CURRENCY_B]]
      }
      return tokens
    }, {})

  const pairs = Object.entries(yieldFarmingTokens)
    .reduce((tokens, token) => {
      tokens[`${token[1][CURRENCY_A]}-${token[1][CURRENCY_B]}`] = token[1][EXCHANGE_ADDRESS]
      return tokens
    }, {})

  const [farmState, dispatchFarmState] = useReducer(
    (state, action) => farmStateReducer(state, chainId, action),
    {
      currencyAURL: params.currencyA,
      currencyBURL: params.currencyB,
      exactFieldURL: params.exactField,
      exactAmountURL: params.exactAmount
    },
    getInitialSwapState
  )

  const { currencyA, currencyB, independentValue, independentField, dependentValue } = farmState

  const yieldFarmingContract = useYieldFarmingProxyContract(YIELD_FARMING_PROXY_ADDRESS)
  const [isFarmingApproved, setIsFarmingApproved] = useState(false)

  const fetchIsFarmingApproved = useCallback(() => {
    if (isAddress(account)) {
      yieldFarmingContract
        .isGloballyTrustedProxy(YIELD_FARMING_ROUTER_ADDRESS)
        .then((isGloballyApproved) => {
          if (!isGloballyApproved) {
            return yieldFarmingContract
              .isApproved(account, YIELD_FARMING_ROUTER_ADDRESS)
              .then(isApproved => setIsFarmingApproved(isApproved))
          } else {
            setIsFarmingApproved(true)
          }
        })
        .catch(error => {
          console.error('Error getting is approved ', error)
          setIsFarmingApproved(false)
        })
    }
  }, [account, yieldFarmingContract])
  useEffect(() => {
    fetchIsFarmingApproved()
    library.on('block', fetchIsFarmingApproved)

    return () => {
      library.removeListener('block', fetchIsFarmingApproved)
    }
  }, [fetchIsFarmingApproved, library])

  const isFarmingActive = useIsYieldFarmingActive()

  const dmgDecimals = 18
  const currencyADecimals = ALL_TOKENS_CONTEXT[chainId][currencyA][DECIMALS]
  const currencyBDecimals = ALL_TOKENS_CONTEXT[chainId][currencyB][DECIMALS]

  const independentDecimals = independentField === INDEPENDENT_CURRENCY_A ? currencyADecimals : currencyBDecimals
  const dependentDecimals = independentField === INDEPENDENT_CURRENCY_A ? currencyBDecimals : currencyADecimals
  const isCurrencyAIndependent = independentField === INDEPENDENT_CURRENCY_A

  const currencyAIsETH = currencyA === ETH_ADDRESS
  const currencyBIsETH = currencyB === ETH_ADDRESS
  const oneCurrencyIsETH = currencyAIsETH || currencyBIsETH

  const allowanceCurrencyA = useAddressAllowance(account, currencyA, YIELD_FARMING_ROUTER_ADDRESS) || ethers.constants.Zero
  const allowanceCurrencyB = useAddressAllowance(account, currencyB, YIELD_FARMING_ROUTER_ADDRESS) || (currencyBIsETH ? ethers.constants.MaxUint256 : ethers.constants.Zero)

  const [independentError, setIndependentError] = useState('')

  useEffect(() => {
    if (!independentError && !isFarmingActive) {
      setIndependentError(t('farmNotActive'))
    } else {
      setIndependentError(null)
    }
  }, [independentError, isFarmingActive, t])

  const [independentValueParsed, setIndependentValueParsed] = useState(ethers.constants.Zero)
  const dependentValueFormatted = !!(dependentValue && (dependentDecimals || dependentDecimals === 0))
    ? amountFormatter(
      dependentValue,
      dependentDecimals,
      Math.min(MIN_DECIMALS, isCurrencyAIndependent ? currencyADecimals : currencyBDecimals),
      false
    )
    : ''

  useEffect(() => {
    if (independentValue && (independentDecimals || independentDecimals === 0)) {
      try {
        const parsedValue = ethers.utils.parseUnits(independentValue, independentDecimals)
        const minValue = ethers.BigNumber.from(1)

        if (parsedValue.lte(ethers.constants.Zero) || parsedValue.gte(ethers.constants.MaxUint256)) {
          throw Error()
        } else if (parsedValue.lt(minValue) || !parsedValue.mod(minValue).eq(0)) {
          throw Error()
        } else {
          setIndependentValueParsed(parsedValue)
          setIndependentError(null)
        }
      } catch (error) {
        setIndependentError(t('inputNotValid'))
      }

      return () => {
        setIndependentValueParsed(ethers.constants.Zero)
        setIndependentError('')
      }
    }
  }, [independentValue, independentDecimals, t])

  const currencyAInputValueParsed = independentField === INDEPENDENT_CURRENCY_A ? independentValueParsed : ethers.BigNumber.from(dependentValue || 0)
  const currencyAInputValueFormatted = independentField === INDEPENDENT_CURRENCY_A ? independentValue : dependentValueFormatted

  const currencyBInputValueParsed = independentField === INDEPENDENT_CURRENCY_B ? independentValueParsed : ethers.BigNumber.from(dependentValue || 0)
  const currencyBInputValueFormatted = independentField === INDEPENDENT_CURRENCY_B ? independentValue : dependentValueFormatted

  const [showUnlockCurrencyA, setShowUnlockCurrencyA] = useState(true)
  const [showUnlockCurrencyB, setShowUnlockCurrencyB] = useState(true)

  const exchangeAddress = pairs[`${currencyA}-${currencyB}`]
  const exchangeContract = useExchangeContract(exchangeAddress)

  const currencyABalance = useAddressBalance(account, currencyA)
  const currencyBBalance = useAddressBalance(account, currencyB)

  const exchangeCurrencyABalance = useAddressBalance(exchangeAddress, currencyA) || ethers.constants.Zero
  const exchangeCurrencyBBalance = useAddressBalance(exchangeAddress, currencyB === ETH_ADDRESS ? WETH_ADDRESS : currencyB) || ethers.constants.Zero

  const userDepositedLiquidityBalance = useAddressYieldFarmingBalance(account, exchangeAddress)
  const userDmgRewardBalance = useAddressDmgRewardBalance(account, exchangeAddress)

  const exchangeRate = getExchangeRate(exchangeCurrencyABalance, currencyADecimals, exchangeCurrencyBBalance, currencyBDecimals)
  const exchangeRateInverted = getExchangeRate(exchangeCurrencyABalance, currencyADecimals, exchangeCurrencyBBalance, currencyBDecimals, true)

  const currencyASymbol = ALL_TOKENS_CONTEXT['1'][currencyA][SYMBOL]
  const currencyBSymbol = ALL_TOKENS_CONTEXT['1'][currencyB][SYMBOL]

  useEffect(() => {
    if (allowanceCurrencyA.eq(ethers.BigNumber.from(0)) || currencyAInputValueParsed.gt(allowanceCurrencyA)) {
      setIndependentError(`You must unlock ${currencyASymbol} to begin farming`)
      setShowUnlockCurrencyA(true)
    } else {
      setIndependentError('')
      setShowUnlockCurrencyA(false)
    }

    if (allowanceCurrencyB.eq(ethers.BigNumber.from(0)) || currencyBInputValueParsed.gt(allowanceCurrencyB)) {
      setIndependentError(`You must unlock ${currencyBSymbol} to begin farming`)
      setShowUnlockCurrencyB(true)
    } else {
      setIndependentError('')
      setShowUnlockCurrencyB(false)
    }
  }, [allowanceCurrencyA, allowanceCurrencyB, currencyAInputValueParsed, currencyASymbol, currencyBInputValueParsed, currencyBSymbol])

  const [totalPoolTokens, setTotalPoolTokens] = useState(ethers.constants.Zero)
  const fetchPoolTokens = useCallback(() => {
    if (exchangeContract && isAddress(account)) {
      exchangeContract.totalSupply().then(totalSupply => {
        setTotalPoolTokens(totalSupply)
      })
    }
  }, [exchangeContract, account])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  const [feesByToken, setFeesByToken] = useState('-')
  const fetchFeesByToken = useCallback(() => {
    if (exchangeAddress) {
      return fetch(`${DMM_API_URL}/v1/yield-farming/tokens/${exchangeAddress}/fees`)
        .then(response => response.json())
        .then(data => setFeesByToken(data.data))
    }
  }, [exchangeAddress])
  useEffect(() => {
    fetchFeesByToken()
    library.on('block', fetchFeesByToken)

    return () => {
      library.removeListener('block', fetchFeesByToken)
    }
  }, [fetchFeesByToken, library])

  const [dmgPriceUsdWei, setDmgPriceUsdWei] = useState(undefined)
  const fetchDmgPriceWei = useCallback(() => {
    return fetch(`${DMM_API_URL}/v1/dmg/price/wei`)
      .then(response => response.json())
      .then(data => setDmgPriceUsdWei(data.data))
  })
  useEffect(() => {
    fetchDmgPriceWei()
    library.on('block', fetchDmgPriceWei)

    return () => {
      library.removeListener('block', fetchDmgPriceWei)
    }
  }, [fetchDmgPriceWei, library])

  const currencyADepositValue = (!!totalPoolTokens && userDepositedLiquidityBalance && !totalPoolTokens.eq(ethers.constants.Zero)) ? userDepositedLiquidityBalance.mul(exchangeCurrencyABalance).div(totalPoolTokens) : undefined
  const currencyBDepositValue = (!!totalPoolTokens && userDepositedLiquidityBalance && !totalPoolTokens.eq(ethers.constants.Zero)) ? userDepositedLiquidityBalance.mul(exchangeCurrencyBBalance).div(totalPoolTokens) : undefined

  const poolTokenPercentage =
    userDepositedLiquidityBalance && totalPoolTokens && !(totalPoolTokens.eq(ethers.constants.Zero))
      ? userDepositedLiquidityBalance.mul(oneWei).div(totalPoolTokens)
      : undefined

  const currencyAShare = (!currencyABalance || !poolTokenPercentage) ? ethers.constants.Zero
    : exchangeCurrencyABalance.mul(poolTokenPercentage).div(oneWei)

  const currencyBShare = (!currencyBBalance || !poolTokenPercentage) ? ethers.constants.Zero
    : exchangeCurrencyBBalance.mul(poolTokenPercentage).div(oneWei)

  const initialAprs = Object.entries(yieldFarmingTokens)
    .reduce((tokens, token) => {
      tokens[ALL_TOKENS_CONTEXT[chainId][token[1][CURRENCY_A]][SYMBOL]] = '...'
      return tokens
    }, {})
  const [aprs, setAprs] = useState(initialAprs)
  useInterval(async () => {
    const responsePromises = Object.entries(yieldFarmingTokens)
      .map(async (token) => {
        const currencyASymbol = ALL_TOKENS_CONTEXT[chainId][token[1][CURRENCY_A]][SYMBOL]
        if (currencyASymbol.substring(1) === ALL_TOKENS_CONTEXT[chainId][token[1][CURRENCY_B]][SYMBOL]) {
          const exchangeAddress = token[1][EXCHANGE_ADDRESS]
          return fetch(`${DMM_API_URL}/v1/yield-farming/tokens/${exchangeAddress}/current-apr`)
            .then(response => response.json())
            .then(data => [currencyASymbol, data.data])
        } else {
          return Promise.resolve()
        }
      })

    const responses = await Promise.all(responsePromises)
    const newAprs = responses
      .filter(responseOpt => !!responseOpt)
      .reduce((tokens, response) => {
        tokens[response[0]] = response[1]
        return tokens
      }, {})
    setAprs(newAprs)
  }, 15 * 1000, true)

  const [dmgLeft, setDmgLeft] = useState('...')
  useInterval(async () => {
    const amountLeftWei = await fetch(`${DMM_API_URL}/v1/yield-farming/dmg-left`)
      .then(response => response.json())
      .then(data => ethers.BigNumber.from(data.data))
      .catch(() => '...')

    if (amountLeftWei === '...') {
      setDmgLeft('...')
    } else {
      const amountLeftDecimal = amountFormatter(amountLeftWei, 18, 2, true, true)
      setDmgLeft(amountLeftDecimal)
    }
  }, 15 * 1000, true)

  const [walletApr, setWalletApr] = useState('...')
  useInterval(async () => {
    await fetch(`${DMM_API_URL}/v1/yield-farming/addresses/${account}/current-apr`)
      .then(response => response.json())
      .then(data => setWalletApr(!!data.data ? data.data : '...'))
      .catch(() => '...')
  }, 15 * 1000, true, [account])

  useEffect(() => {
    const amount = independentValueParsed
    if (amount) {
      try {
        if (independentField === INDEPENDENT_CURRENCY_A) {
          const calculatedDependentValue = calculateCurrencyBFromCurrencyA(amount, exchangeCurrencyABalance, exchangeCurrencyBBalance)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchFarmState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        } else {
          const calculatedDependentValue = calculateCurrencyAFromCurrencyB(amount, exchangeCurrencyABalance, exchangeCurrencyBBalance)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchFarmState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        }
      } catch (error) {
        setIndependentError('Invalid Value')
      }
      return () => {
        dispatchFarmState({ type: 'UPDATE_DEPENDENT', payload: '' })
      }
    }
  }, [independentValueParsed, exchangeCurrencyABalance, exchangeCurrencyBBalance, independentField, t, isFarmingActive])

  const [isBeginValid, setIsBeginValid] = useState(false)
  useEffect(() => {
    if (showUnlockCurrencyA) {
      setIsBeginValid(false)
    } else if (showUnlockCurrencyB) {
      setIsBeginValid(false)
    } else if (!currencyABalance || currencyABalance.lt(currencyAInputValueParsed)) {
      setIndependentError(t('insufficientBalanceForSymbol', { symbol: currencyASymbol }))
      setIsBeginValid(false)
    } else if (!currencyBBalance || currencyBBalance.lt(currencyBInputValueParsed)) {
      setIndependentError(t('insufficientBalanceForSymbol', { symbol: currencyBSymbol }))
      setIsBeginValid(false)
    } else if (!currencyAInputValueParsed || currencyAInputValueParsed.eq(ethers.constants.Zero)) {
      setIsBeginValid(false)
    } else if (!currencyBInputValueParsed || currencyBInputValueParsed.eq(ethers.constants.Zero)) {
      setIsBeginValid(false)
    } else {
      setIndependentError('')
      setIsBeginValid(true)
    }

    return () => {
      setIndependentError('')
      setIsBeginValid(true)
    }
  }, [showUnlockCurrencyA, showUnlockCurrencyB, currencyABalance, currencyBBalance, currencyAInputValueParsed, currencyBInputValueParsed, currencyASymbol, currencyBSymbol, t, isFarmingActive])

  const [isEndValid, setIsEndValid] = useState(false)
  useEffect(() => {
    if (!currencyADepositValue || currencyADepositValue.eq(ethers.constants.Zero)) {
      setIsEndValid(false)
    } else if (!currencyBDepositValue || currencyBDepositValue.eq(ethers.constants.Zero)) {
      setIsEndValid(false)
    } else {
      setIsEndValid(true)
    }

    return () => {
      setIndependentError('')
      setIsEndValid(true)
    }
  }, [currencyABalance, currencyBBalance, currencyADepositValue, currencyBDepositValue, currencyASymbol, currencyBSymbol, t, isFarmingActive])

  const [currencyAError] = useState('')
  const [currencyBError] = useState('')

  const dependentValueMinimum = !!dependentValue ? dependentValue.mul(ethers.BigNumber.from(9)).div(ethers.BigNumber.from(10)) : ethers.constants.Zero
  const dependentValueMaximum = !!dependentValue ? dependentValue.mul(ethers.BigNumber.from(11)).div(ethers.BigNumber.from(10)) : ethers.constants.Zero

  const addTransaction = useTransactionAdder()
  const dmgYieldFarmingRouter = useYieldFarmingRouterContract(YIELD_FARMING_ROUTER_ADDRESS, true)

  const acceptFarmingDisclaimer = () => {
    localStorage.setItem(ACCEPT_FARMING_KEY, 'true')
    setIsDisclaimerAccepted(true)
  }

  const approveFarmingIfNeeded = () => {
    if (!isFarmingApproved) {
      yieldFarmingContract.approve(YIELD_FARMING_ROUTER_ADDRESS, true)
    }
  }

  const beginYieldFarming = async () => {
    if (isBeginValid) {
      approveFarmingIfNeeded()

      let estimatedGas
      if (oneCurrencyIsETH) {
        estimatedGas = await dmgYieldFarmingRouter.estimateGas
          .addLiquidityETH(
            currencyA,
            currencyAInputValueParsed.toString(),
            currencyAInputValueParsed.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBInputValueParsed.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            { value: currencyBInputValueParsed.toString() }
          )
          .catch(error => {
            console.error('Error getting gas estimation for adding liquidity: ', error)
            return ethers.BigNumber.from('450000')
          })

        dmgYieldFarmingRouter
          .addLiquidityETH(
            currencyA,
            currencyAInputValueParsed.toString(),
            currencyAInputValueParsed.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBInputValueParsed.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN), value: currencyBInputValueParsed }
          )
          .then(response => {
            addTransaction(response)
          })
          .catch(error => {
            if (error?.code !== 4001) {
              console.error(`Could not start farming ${currencyASymbol} due to error: `, error)
              Sentry.captureException(error)
            } else {
              console.log('Could not approve tokens because the txn was cancelled')
            }
          })
      } else {
        estimatedGas = await dmgYieldFarmingRouter.estimateGas
          .addLiquidity(
            currencyA,
            currencyB,
            currencyAInputValueParsed.toString(),
            currencyBInputValueParsed.toString(),
            currencyAInputValueParsed.mul(9).div(10).toString(),
            currencyBInputValueParsed.mul(9).div(10).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString())
          )
          .catch(error => {
            console.error('Error getting gas estimation for adding liquidity: ', error)
            return ethers.BigNumber.from('500000')
          })
        dmgYieldFarmingRouter
          .addLiquidity(
            currencyA,
            currencyB,
            currencyAInputValueParsed.toString(),
            currencyBInputValueParsed.toString(),
            currencyAInputValueParsed.mul(9).div(10).toString(),
            currencyBInputValueParsed.mul(9).div(10).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN).toString() }
          )
          .then(response => {
            addTransaction(response)
          })
          .catch(error => {
            if (error?.code !== 4001) {
              console.error(`Could not start farming ${currencyASymbol} due to error: `, error)
              Sentry.captureException(error)
            } else {
              console.log('Could not approve tokens because the txn was cancelled')
            }
          })
      }
    }
  }

  const [isDisplayConfirmWithdraw, setIsDisplayConfirmWithdraw] = useState(false)

  const endYieldFarming = async () => {
    if (userDepositedLiquidityBalance && currencyADepositValue && currencyBDepositValue && userDepositedLiquidityBalance.gt(ethers.constants.Zero)) {
      approveFarmingIfNeeded()

      let estimatedGas
      if (oneCurrencyIsETH) {
        estimatedGas = await dmgYieldFarmingRouter.estimateGas
          .removeLiquidityETH(
            currencyA,
            userDepositedLiquidityBalance,
            currencyADepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBDepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            isFarmingActive
          )
          .catch(error => {
            console.error('Error getting gas estimation for adding liquidity: ', error)
            return ethers.BigNumber.from('500000')
          })

        dmgYieldFarmingRouter
          .removeLiquidityETH(
            currencyA,
            userDepositedLiquidityBalance,
            currencyADepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBDepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            isFarmingActive,
            { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN).toString() }
          )
          .then(response => {
            addTransaction(response)
          })
          .catch(error => {
            if (error?.code !== 4001) {
              console.error(`Could not start farming ${currencyASymbol} due to error: `, error)
              Sentry.captureException(error)
            } else {
              console.log('Could not approve tokens because the txn was cancelled')
            }
          })
      } else {
        estimatedGas = await dmgYieldFarmingRouter.estimateGas
          .removeLiquidity(
            currencyA,
            currencyB,
            userDepositedLiquidityBalance,
            currencyADepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBDepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            isFarmingActive
          )
          .catch(error => {
            console.error('Error getting gas estimation for adding liquidity: ', error)
            return ethers.BigNumber.from('500000')
          })
        dmgYieldFarmingRouter
          .removeLiquidity(
            currencyA,
            currencyB,
            userDepositedLiquidityBalance,
            currencyADepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            currencyBDepositValue.mul(SLIPPAGE_FACTOR.sub(ALLOWED_SLIPPAGE)).div(SLIPPAGE_FACTOR).toString(),
            parseInt(((new Date().getTime() / 1000) + FIFTEEN_MINUTES_SECONDS).toString()),
            isFarmingActive,
            { gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN).toString() }
          )
          .then(response => {
            setIsDisplayConfirmWithdraw(false)
            addTransaction(response)
          })
          .catch(error => {
            if (error?.code !== 4001) {
              console.error(`Could not start farming ${currencyASymbol} due to error: `, error)
              Sentry.captureException(error)
            } else {
              console.log('Could not approve tokens because the txn was cancelled')
            }
            setIsDisplayConfirmWithdraw(false)
          })
      }
    }
  }

  const [isCurrencyADisplayed, setIsCurrencyADisplayed] = useState(true)
  const [isExchangeRateInverted, setIsExchangeRateInverted] = useState(false)
  const [isUsingDmgPriceUsd, setIsUsingDmgPriceUsd] = useState(false)
  const fees = feesByToken === '-' ? 0 : parseFloat(feesByToken.substring(0, feesByToken.length - 1)) / 100.0
  const feesWei = ethers.utils.parseEther(fees.toString())
  const feeAmountWei = !!currencyBDepositValue ? currencyBDepositValue.mul(feesWei).div(ethers.BigNumber.from('1000000000000000000')) : ethers.constants.Zero
  const feeAmountFormatted = amountFormatter(feeAmountWei, currencyBDecimals, 6, false, false)

  let dmgRewardValueUsd = '0.00'
  if (isUsingDmgPriceUsd && !!dmgPriceUsdWei) {
    dmgRewardValueUsd = userDmgRewardBalance.mul(dmgPriceUsdWei).div(ethers.BigNumber.from('1000000000000000000'))
    dmgRewardValueUsd = amountFormatter(dmgRewardValueUsd, 18, 2, true, true)
  }

  return (
    <FarmingWrapper>
      {isDisplayConfirmWithdraw &&
      <BackDrop>
        <Card>
          <CardTitle>
            Confirm Withdraw Farming
          </CardTitle>
          <Underline/>
          <CardText>
            You are withdrawing your active farm, which incurs a {feesByToken} fee on the amount
            of {currencyBSymbol} you deposited. The expected fee is about {feeAmountFormatted} {currencyBSymbol}.
          </CardText>
          <ConfirmButtonsWrapper>
            <Button onClick={() => setIsDisplayConfirmWithdraw(false)}>
              Deny
            </Button>
            <Button onClick={endYieldFarming}>
              Confirm
            </Button>
          </ConfirmButtonsWrapper>
        </Card>
      </BackDrop>
      }
      {!isDisclaimerAccepted && (<OverlayContent>
        {t('yieldFarmingDisclaimer_1')}
        <br/>
        <br/>
        {t('yieldFarmingDisclaimer_2')}
        <OverlayAcceptButton>
          <Button onClick={acceptFarmingDisclaimer}>
            {t('iAccept')}
          </Button>
        </OverlayAcceptButton>
      </OverlayContent>)}
      <InfoPanel disabled={!isDisclaimerAccepted}>
        <Title>
          Farming Info
        </Title>
        <Underline/>
        <Amount>
          {Object.keys(aprs).map((key) => {
            return (
              <InlineAmount>
                <Label>
                  {key} APR
                </Label>
                <Value>
                  {aprs[key]}
                </Value>
              </InlineAmount>
            )
          })}
        </Amount>
        <Amount>
          <Label>
            Left for redemption
          </Label>
          <Value>
            {dmgLeft} DMG
          </Value>
        </Amount>
        <Title>
          Your Wallet
        </Title>
        <Underline/>
        <Amount>
          <Label>
            Earning a net APY of
          </Label>
          <Value>
            {walletApr}
          </Value>
        </Amount>
      </InfoPanel>
      <Wrapper disabled={!isDisclaimerAccepted}>
        {/* CURRENCY A */}
        <CurrencyInputPanel
          title={t('deposit', { extra: 'mTokens' })}
          extraText={currencyABalance ? formatBalance(amountFormatter(currencyABalance, currencyADecimals, 6)) : ''}
          onValueChange={inputValue => {
            dispatchFarmState({
              type: 'UPDATE_INDEPENDENT',
              payload: { value: inputValue, field: INDEPENDENT_CURRENCY_A }
            })
          }}
          extraTextClickHander={() => {
            if (currencyABalance) {
              dispatchFarmState({
                type: 'UPDATE_INDEPENDENT',
                payload: {
                  value: amountFormatter(calculateMaxOutputVal(currencyABalance, currencyA), currencyADecimals, currencyADecimals, false),
                  field: INDEPENDENT_CURRENCY_A
                }
              })
            }
          }}
          selectedTokenAddress={currencyA}
          value={currencyAInputValueFormatted}
          onCurrencySelected={currencyA => {
            dispatchFarmState({
              type: 'SELECT_CURRENCY',
              payload: { currency: currencyA, field: INDEPENDENT_CURRENCY_A }
            })
          }}
          errorMessage={currencyAError ? currencyAError : independentField === INDEPENDENT_CURRENCY_A ? independentError : ''}
          showUnlock={showUnlockCurrencyA}
          minDecimals={Math.min(currencyADecimals, 6)}
          unlockAddress={YIELD_FARMING_ROUTER_ADDRESS}
          tokenList={mTokens}
        />
        {/* END CURRENCY A */}
        <OversizedPanel>
          <DownArrowBackground>
            <ColoredWrappedPlus active={'true'} alt="plus"/>
          </DownArrowBackground>
        </OversizedPanel>
        {/* CURRENCY B */}
        <CurrencyInputPanel
          title={t('deposit', { extra: 'Tokens' })}
          description={''}
          extraText={currencyBBalance ? formatBalance(amountFormatter(currencyBBalance, currencyBDecimals, 6)) : ''}
          selectedTokenAddress={currencyB}
          onCurrencySelected={currencyB => {
            dispatchFarmState({
              type: 'SELECT_CURRENCY',
              payload: { currency: currencyB, field: INDEPENDENT_CURRENCY_B }
            })
          }}
          onValueChange={outputValue => {
            dispatchFarmState({
              type: 'UPDATE_INDEPENDENT',
              payload: { value: outputValue, field: INDEPENDENT_CURRENCY_B }
            })
          }}
          extraTextClickHander={() => {
            if (currencyBBalance) {
              dispatchFarmState({
                type: 'UPDATE_INDEPENDENT',
                payload: {
                  value: amountFormatter(calculateMaxOutputVal(currencyBBalance, currencyB), currencyBDecimals, currencyBDecimals, false),
                  field: INDEPENDENT_CURRENCY_B
                }
              })
            }
          }}
          value={currencyBInputValueFormatted}
          showUnlock={showUnlockCurrencyB}
          errorMessage={currencyBError ? currencyBError : independentField === INDEPENDENT_CURRENCY_B ? independentError : ''}
          minDecimals={Math.min(currencyBDecimals, 6)}
          unlockAddress={YIELD_FARMING_ROUTER_ADDRESS}
          tokenList={underlyingTokens}
        />
        {/* END CURRENCY B */}
        <OversizedPanel style={{ boxShadow: `1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5)` }}
                        hideTop hideBottom>
          <SummaryPanel>
            <ExchangeRateWrapper>
              <ExchangeRate>{t('exchangeRate')}</ExchangeRate>
              <CurrencySwitcher onClick={() => setIsExchangeRateInverted(!isExchangeRateInverted)}>
                {!isExchangeRateInverted && (exchangeRate ? `1 ${currencyASymbol} = ${amountFormatter(exchangeRate, 18, 6)} ${currencyBSymbol}` : ' - ')}
                {isExchangeRateInverted && (exchangeRateInverted ? `1 ${currencyBSymbol} = ${amountFormatter(exchangeRateInverted, 18, 6)} ${currencyASymbol}` : ' - ')}
              </CurrencySwitcher>
            </ExchangeRateWrapper>
            <ExchangeRateWrapper>
              <ExchangeRate>{t('currentPoolSize')}</ExchangeRate>
              <CurrencySwitcher onClick={() => setIsCurrencyADisplayed(!isCurrencyADisplayed)}>
                {isCurrencyADisplayed && ((exchangeCurrencyABalance.eq(ethers.constants.Zero)) ? '-' : `${amountFormatter(exchangeCurrencyABalance, currencyADecimals, 4)} ${currencyASymbol}`)}
                {!isCurrencyADisplayed && ((exchangeCurrencyBBalance.eq(ethers.constants.Zero)) ? '-' : `${amountFormatter(exchangeCurrencyBBalance, currencyBDecimals, 4)} ${currencyBSymbol}`)}
              </CurrencySwitcher>
            </ExchangeRateWrapper>
            <ExchangeRateWrapper>
              <ExchangeRate>
                {t('yourPoolShare')} ({currencyABalance && amountFormatter(poolTokenPercentage, 16, 4)}%)
              </ExchangeRate>
              <CurrencySwitcher onClick={() => setIsCurrencyADisplayed(!isCurrencyADisplayed)}>
                {isCurrencyADisplayed && (currencyAShare.eq(ethers.constants.Zero) ? '-' : `${amountFormatter(currencyAShare, currencyADecimals, 4)} ${currencyASymbol}`)}
                {!isCurrencyADisplayed && (currencyBShare.eq(ethers.constants.Zero) ? '-' : `${amountFormatter(currencyBShare, currencyBDecimals, 4)} ${currencyBSymbol}`)}
              </CurrencySwitcher>
            </ExchangeRateWrapper>
            <ExchangeRateWrapper>
              <ExchangeRate>
                {t('dmgRewardBalance')}
              </ExchangeRate>
              <CurrencySwitcher onClick={() => setIsUsingDmgPriceUsd(!isUsingDmgPriceUsd)}>
                {!isUsingDmgPriceUsd && (!userDmgRewardBalance ? '-' : `${amountFormatter(userDmgRewardBalance, dmgDecimals, 4)} DMG`)}
                {isUsingDmgPriceUsd && `~ $${dmgRewardValueUsd}`}
              </CurrencySwitcher>
            </ExchangeRateWrapper>
            <ExchangeRateWrapper>
              <ExchangeRate>
                {t('withdrawalFee')}
              </ExchangeRate>
              <span>{feesByToken}</span>
            </ExchangeRateWrapper>
          </SummaryPanel>
        </OversizedPanel>
        {}
        <TransactionDetails
          account={account}
          setRawSlippage={() => undefined}
          setRawTokenSlippage={() => undefined}
          rawSlippage={0}
          slippageWarning={false}
          highSlippageWarning={false}
          inputError={currencyAError}
          independentError={independentError}
          inputCurrency={currencyA}
          outputCurrency={currencyB}
          independentValue={independentValue}
          independentValueParsed={independentValueParsed}
          independentField={independentField}
          INPUT={INDEPENDENT_CURRENCY_A}
          inputValueParsed={currencyAInputValueParsed}
          outputValueParsed={currencyBInputValueParsed}
          inputSymbol={currencyASymbol}
          outputSymbol={currencyBSymbol}
          dependentValueMinimum={dependentValueMinimum}
          dependentValueMaximum={dependentValueMaximum}
          dependentDecimals={dependentDecimals}
          independentDecimals={independentDecimals}
          setCustomSlippageError={() => undefined}
          wrapWarning={false}
          recipientAddress={undefined}
          sending={false}
        />
        <Flex>
          <Button disabled={!isFarmingActive || !isBeginValid} onClick={beginYieldFarming}>
            {isFarmingApproved ? t('farm') : t('approveFarming')}
          </Button>
          <Button disabled={!isEndValid || !isFarmingApproved} onClick={() => setIsDisplayConfirmWithdraw(true)}>
            {isFarmingActive ? t('endFarming') : t('withdraw')}
          </Button>
        </Flex>
      </Wrapper>
    </FarmingWrapper>
  )

}