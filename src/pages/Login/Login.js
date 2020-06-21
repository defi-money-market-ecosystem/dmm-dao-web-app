import React, { useState } from 'react'

import './Login.css'
import DMMLogo from '../../assets/images/dmm-logo.svg'
import Button from '@material-ui/core/Button'
import { getDefaultApiKeyHeaders, getIpAddress, routes, sessionId } from '../../utils/api-signer'
import { DELEGATE_ADDRESS, WETH_ADDRESS, DAI_ADDRESS, USDC_ADDRESS, ETH_ADDRESS } from '../../contexts/Tokens'
import { ethers } from 'ethers/index'
import { calculateGasMargin } from '../../utils'
import * as Sentry from '@sentry/browser/dist/index'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressAllowance } from '../../contexts/Allowances'
import { bigNumberify } from 'ethers/utils/index'
import CircularProgress from '@material-ui/core/CircularProgress'


export default function Login() {

  const wethTokenContract = useTokenContract(WETH_ADDRESS);

  const daiTokenContract = useTokenContract(DAI_ADDRESS);

  const usdcTokenContract = useTokenContract(USDC_ADDRESS);

  const addTransaction = useTransactionAdder();

  const GAS_MARGIN = ethers.utils.bigNumberify(1000);

  const { account } = useWeb3React();

  const userWethTokenBalance = useAddressBalance(account, WETH_ADDRESS);

  const userDaiTokenBalance = useAddressBalance(account, DAI_ADDRESS);

  const userUsdcTokenBalance = useAddressBalance(account, USDC_ADDRESS);

  const wethInputAllowance = useAddressAllowance(account, WETH_ADDRESS, DELEGATE_ADDRESS);

  const daiInputAllowance = useAddressAllowance(account, DAI_ADDRESS, DELEGATE_ADDRESS);

  const usdcInputAllowance = useAddressAllowance(account, USDC_ADDRESS, DELEGATE_ADDRESS);

  const [wethUnlocking, setWethUnlocking] = useState(false);

  const [daiUnlocking, setDaiUnlocking] = useState(false);

  const [usdcUnlocking, setUsdcUnlocking] = useState(false);

  return (
    <div className={'loginScreen'}>
      <div className={'loginScreenInner'}>
        <div className={'loginScreenTitleWrapper'}>
          <div className={'loginScreenDmmLogo'}>
            <img src={DMMLogo} alt={'Logo'}/>
          </div>
          <div className={'loginScreenTitleInner'}>
            <div className={'loginScreenTitle'}>DMG Token Sale</div>
            <div className={'loginScreenSubtitle'}>Private Round</div>
          </div>
        </div>
        <div className={'loginScreenDescription'}>
          <div className={'loginScreenLineOne'}>
            Due to a high level of demand, the private sale has ended after reaching a cap of $2M.
          </div>
          <div>
            The public sale of DMG will occur on June 22.
          </div>
          <br/>
          <div>
            If you would like to save time on the day of the public sale, you can unlock your token for trading right now below.
          </div>
          <div>
            An additional note is that while you will be able to purchase DMG with ETH, it will be faster to use WETH (Wrapped Ether). Using DAI and USDC will be equally as fast as WETH.
          </div>
        </div>
        <div className={'unlockWrapper'}>
          <div className={'unlockRow'}>
            <div className={'unlockToken'}>
              WETH
            </div>
            <div className={'unlockButtonWrapper'}>
                { wethInputAllowance && wethInputAllowance.lt(bigNumberify(1000)) ? (
                  wethUnlocking ? (
                    <Button
                      className={'unlockButton'}
                    >
                      <CircularProgress/>
                    </Button>
                    ) : (
                    <Button
                      className={'unlockButton'}
                      onClick={async () => {
                        setWethUnlocking(true);
                        const token = 'WETH';
                        let estimatedGas;
                        let useUserBalance = false;
                        const selectedTokenAddress = wethTokenContract;
                        const userTokenBalance = userWethTokenBalance;
                        estimatedGas = await wethTokenContract.estimate
                          .approve(DELEGATE_ADDRESS, ethers.constants.MaxUint256)
                          .catch(error => {
                            console.error('Error setting max token approval ', error);
                            setWethUnlocking(false);
                          })
                        if (!estimatedGas) {
                          // general fallback for tokens who restrict approval amounts
                          estimatedGas = await wethTokenContract.estimate.approve(DELEGATE_ADDRESS, userWethTokenBalance)
                          useUserBalance = true
                        }
                        wethTokenContract
                          .approve(DELEGATE_ADDRESS, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                            gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                          })
                          .then(response => {
                            addTransaction(response, { approval: selectedTokenAddress })
                          })
                          .catch(error => {
                            setWethUnlocking(false);
                            if (error?.code !== 4001) {
                              console.error(`Could not approve ${token} due to error: `, error)
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
                  <Button
                    className={'unlockButton'}
                  >
                    Unlocked
                  </Button>
                ) }
            </div>
          </div>
          <div className={'unlockRow'}>
            <div className={'unlockToken'}>
              DAI
            </div>
            <div className={'unlockButtonWrapper'}>
              { daiInputAllowance && daiInputAllowance.lt(bigNumberify(1000)) ? (
                daiUnlocking ? (
                  <Button
                    className={'unlockButton'}
                  >
                    <CircularProgress/>
                  </Button>
                ) : (
                  <Button
                    className={'unlockButton'}
                    onClick={async () => {
                      setDaiUnlocking(true);
                      const token = 'DAI';
                      let estimatedGas;
                      let useUserBalance = false;
                      const selectedTokenAddress = daiTokenContract;
                      const userTokenBalance = userDaiTokenBalance;
                      estimatedGas = await daiTokenContract.estimate
                        .approve(DELEGATE_ADDRESS, ethers.constants.MaxUint256)
                        .catch(error => {
                          setDaiUnlocking(false);
                          console.error('Error setting max token approval ', error)
                        })
                      if (!estimatedGas) {
                        // general fallback for tokens who restrict approval amounts
                        estimatedGas = await daiTokenContract.estimate.approve(DELEGATE_ADDRESS, userDaiTokenBalance)
                        useUserBalance = true
                      }
                      daiTokenContract
                        .approve(DELEGATE_ADDRESS, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                        })
                        .then(response => {
                          addTransaction(response, { approval: selectedTokenAddress })
                        })
                        .catch(error => {
                          setDaiUnlocking(false);
                          if (error?.code !== 4001) {
                            console.error(`Could not approve ${token} due to error: `, error)
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
                <Button
                  className={'unlockButton'}
                >
                  Unlocked
                </Button>
              ) }
            </div>
          </div>
          <div className={'unlockRow'}>
            <div className={'unlockToken'}>
              USDC
            </div>
            <div className={'unlockButtonWrapper'}>
              { usdcInputAllowance && usdcInputAllowance.lt(bigNumberify(1000)) ? (
                usdcUnlocking ? (
                  <Button
                    className={'unlockButton'}
                  >
                    <CircularProgress/>
                  </Button>
                ) : (
                  <Button
                    className={'unlockButton'}
                    onClick={async () => {
                      setUsdcUnlocking(true);
                      const token = 'USDC';
                      let estimatedGas;
                      let useUserBalance = false;
                      const selectedTokenAddress = usdcTokenContract;
                      const userTokenBalance = userUsdcTokenBalance;
                      estimatedGas = await usdcTokenContract.estimate
                        .approve(DELEGATE_ADDRESS, ethers.constants.MaxUint256)
                        .catch(error => {
                          setUsdcUnlocking(false);
                          console.error('Error setting max token approval ', error)
                        })
                      if (!estimatedGas) {
                        // general fallback for tokens who restrict approval amounts
                        estimatedGas = await usdcTokenContract.estimate.approve(DELEGATE_ADDRESS, userUsdcTokenBalance)
                        useUserBalance = true
                      }
                      usdcTokenContract
                        .approve(DELEGATE_ADDRESS, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                        })
                        .then(response => {
                          addTransaction(response, { approval: selectedTokenAddress })
                        })
                        .catch(error => {
                          setUsdcUnlocking(false);
                          if (error?.code !== 4001) {
                            console.error(`Could not approve ${token} due to error: `, error)
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
                <Button
                  className={'unlockButton'}
                >
                  Unlocked
                </Button>
              ) }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

