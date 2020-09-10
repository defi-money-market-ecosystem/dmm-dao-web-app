import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
  useExchangeContract,
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
  M_USDC_ADDRESS,
  SYMBOL,
  USDC_ADDRESS,
  useAllYieldFarmingTokens,
  WETH_ADDRESS,
  YIELD_FARMING_TOKENS
} from '../../contexts/Tokens'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { amountFormatter, calculateGasMargin, DMM_API_URL, MIN_DECIMALS } from '../../utils'
import { ethers } from 'ethers'
import OversizedPanel from '../../components/OversizedPanel'
import { Button } from '../../theme'
import { useAddressBalance } from '../../contexts/Balances'
import styled from 'styled-components'
import { ReactComponent as Plus } from '../../assets/images/plus-blue.svg'
import { YIELD_FARMING_PROXY_ADDRESS, YIELD_FARMING_ROUTER_ADDRESS } from '../../contexts/YieldFarming'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useTranslation } from 'react-i18next'
import TransactionDetails from '../../components/TransactionDetails'
import * as Sentry from '@sentry/browser'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressYieldFarmingBalance } from '../../contexts/YieldFarmingBalances'
import { useAddressDmgRewardBalance } from '../../contexts/DmgRewardBalances'

const Wrapper = styled.div`
  width: 100%;
  margin-top: 32px;
`

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const WrappedPlus = ({ isError, highSlippageWarning, ...rest }) => <Plus {...rest} />

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
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: ${({ theme }) => theme.doveGray};
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

function farmStateReducer(state, chainId, action) {
  switch (action.type) {
    case 'SELECT_CURRENCY': {
      const { field, currency } = action.payload

      const newInputCurrency = field === INDEPENDENT_CURRENCY_A ? currency : YIELD_FARMING_TOKENS[chainId][currency][CURRENCY_A]
      const newOutputCurrency = field === INDEPENDENT_CURRENCY_B ? currency : YIELD_FARMING_TOKENS[chainId][currency][CURRENCY_B]

      if (newInputCurrency === newOutputCurrency) {
        return {
          ...state,
          currencyA: field === INDEPENDENT_CURRENCY_A ? currency : '',
          currencyB: field === INDEPENDENT_CURRENCY_B ? currency : ''
        }
      } else {
        return {
          ...state,
          currencyA: newInputCurrency,
          currencyB: newOutputCurrency
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

  const yieldFarmingTokens = useAllYieldFarmingTokens()
  const mTokens = Object.keys(yieldFarmingTokens)
    .reduce((tokens, key) => {
      tokens[key] = ALL_TOKENS_CONTEXT[chainId][yieldFarmingTokens[key][CURRENCY_A]]
      return tokens
    }, {})
  // .filter((value, index, list) => list.indexOf(value) === index)

  const underlyingTokens = Object.keys(yieldFarmingTokens)
    .reduce((tokens, key) => {
      if (yieldFarmingTokens[key][CURRENCY_B] === 'ETH') {
        tokens['ETH'] = ETH['ETH']
      } else {
        tokens[key] = ALL_TOKENS_CONTEXT[chainId][yieldFarmingTokens[key][CURRENCY_B]]
      }
      return tokens
    }, {})
  // .filter((value, index, list) => list.indexOf(value) === index)

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

  const [isFarmingActive, setIsFarmingActive] = useState(false)
  let subscriptionId
  useEffect(() => {
    const get = () => {
      fetch(`${DMM_API_URL}/v1/yield-farming/is-active`)
        .then(response => response.json())
        .then(response => {
          setIsFarmingActive(response?.data)
        })
        .catch(() => {
          setIsFarmingActive(false)
        })

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
    get()

    subscriptionId = setInterval(() => get(), 15 * 1000)

    return () => clearInterval(subscriptionId)
  }, [account])

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
  }, [independentError, isFarmingActive])

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

  const exchangeAddress = yieldFarmingTokens[currencyA][EXCHANGE_ADDRESS]
  const exchangeContract = useExchangeContract(exchangeAddress)

  const currencyABalance = useAddressBalance(account, currencyA)
  const currencyBBalance = useAddressBalance(account, currencyB)

  const exchangeCurrencyABalance = useAddressBalance(exchangeAddress, currencyA) || ethers.constants.Zero
  const exchangeCurrencyBBalance = useAddressBalance(exchangeAddress, currencyB === ETH_ADDRESS ? WETH_ADDRESS : currencyB) || ethers.constants.Zero

  const userDepositedLiquidityBalance = useAddressYieldFarmingBalance(account, exchangeAddress)
  const userDmgRewardBalance = useAddressDmgRewardBalance(account, exchangeAddress)

  const exchangeRate = getExchangeRate(exchangeCurrencyABalance, currencyADecimals, exchangeCurrencyBBalance, currencyBDecimals)

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
    if (exchangeContract) {
      exchangeContract.totalSupply().then(totalSupply => {
        setTotalPoolTokens(totalSupply)
      })
    }
  }, [exchangeContract])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  const currencyADepositValue = (!!totalPoolTokens && userDepositedLiquidityBalance && !totalPoolTokens.eq(ethers.constants.Zero)) ? userDepositedLiquidityBalance.mul(exchangeCurrencyABalance).div(totalPoolTokens) : undefined
  const currencyBDepositValue = (!!totalPoolTokens && userDepositedLiquidityBalance && !totalPoolTokens.eq(ethers.constants.Zero)) ? userDepositedLiquidityBalance.mul(exchangeCurrencyBBalance).div(totalPoolTokens) : undefined

  const poolTokenPercentage =
    userDepositedLiquidityBalance && totalPoolTokens && !(totalPoolTokens.eq(ethers.constants.Zero))
      ? userDepositedLiquidityBalance.mul(oneWei).div(totalPoolTokens)
      : undefined

  const currencyAShare = (!currencyABalance || !poolTokenPercentage) ? ethers.constants.Zero
    : exchangeCurrencyABalance.mul(poolTokenPercentage).div(oneWei)

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
    } else if (currencyABalance.lt(currencyAInputValueParsed)) {
      setIndependentError(t('insufficientBalanceForSymbol', { symbol: currencyASymbol }))
      setIsBeginValid(false)
    } else if (currencyBBalance.lt(currencyBInputValueParsed)) {
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
  }, [currencyABalance, currencyBBalance, currencyBDepositValue, currencyBDepositValue, currencyASymbol, currencyBSymbol, t, isFarmingActive])

  const [currencyAError] = useState('')
  const [currencyBError] = useState('')

  const dependentValueMinimum = !!dependentValue ? dependentValue.mul(ethers.BigNumber.from(9)).div(ethers.BigNumber.from(10)) : ethers.constants.Zero
  const dependentValueMaximum = !!dependentValue ? dependentValue.mul(ethers.BigNumber.from(11)).div(ethers.BigNumber.from(10)) : ethers.constants.Zero

  const addTransaction = useTransactionAdder()
  const dmgYieldFarmingRouter = useYieldFarmingRouterContract(YIELD_FARMING_ROUTER_ADDRESS, true)

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

  return (
    <Wrapper>
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
      <OversizedPanel hideBottom>
        <SummaryPanel>
          <ExchangeRateWrapper>
            <ExchangeRate>{t('exchangeRate')}</ExchangeRate>
            <span>{exchangeRate ? `1 ${currencyASymbol} = ${amountFormatter(exchangeRate, 18, 6)} ${currencyBSymbol}` : ' - '}</span>
          </ExchangeRateWrapper>
          <ExchangeRateWrapper>
            <ExchangeRate>{t('currentPoolSize')}</ExchangeRate>
            <span>{
              (exchangeCurrencyABalance.eq(ethers.constants.Zero)) ? '-' :
                `${amountFormatter(exchangeCurrencyABalance, currencyADecimals, 4)} ${currencyASymbol}`
            }</span>
          </ExchangeRateWrapper>
          <ExchangeRateWrapper>
            <ExchangeRate>
              {t('yourPoolShare')} ({currencyABalance && currencyABalance && amountFormatter(poolTokenPercentage, 16, 4)}%)
            </ExchangeRate>
            <span>{
              currencyAShare.eq(ethers.constants.Zero) ? '-' :
                `${amountFormatter(currencyAShare, currencyADecimals, 4)} ${currencyASymbol}`
            }</span>
          </ExchangeRateWrapper>
          <ExchangeRateWrapper>
            <ExchangeRate>
              {t('dmgRewardBalance')}
            </ExchangeRate>
            <span>{
              !userDmgRewardBalance ? '-' : `${amountFormatter(userDmgRewardBalance, dmgDecimals, 4)} DMG`
            }</span>
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
        <Button disabled={!isEndValid || !isFarmingApproved} onClick={endYieldFarming}>
          {isFarmingActive ? t('endFarming') : t('withdraw')}
        </Button>
      </Flex>
    </Wrapper>
  )

}