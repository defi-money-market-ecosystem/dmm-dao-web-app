import React from 'react';

import Swapper from "./Swapper";
import withUseWeb3React from '../../hoc/withUseWeb3React'
import withUseTransactionAdder from '../../hoc/withUseTransactionAdder'

import NumberUtil, {BN} from "../../utils/NumberUtil";
import DmmTokenService from "../../services/DmmTokenService";

import {tokenAddressToTokenMap, tokens, WETH} from "../../models/Tokens";
import {asyncForEach} from "../../utils/ArrayUtil";


class Earn extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      counter: 0,
      tokens: tokens,
      underlyingAllowance: NumberUtil._0,
      exchangeRate: null,
      mDaiExchangeRate: null,
      mUsdcExchangeRate: null,
      dmmAllowance: NumberUtil._0,
      underlyingBalance: NumberUtil._0,
      dmmBalance: NumberUtil._0,
      underlyingToken: WETH,
      isMinting: true,
      inputValue: undefined,
      isLoading: false,
      dmmToken: null,
      isWaitingForApprovalToMine: false,
      dmmTokensMap: null,
      activeSupply: NumberUtil._0,
      totalSupply: NumberUtil._0,
      totalTokensPurchased: NumberUtil._0,
    };

    this.address = this.props.account;
  }

  doOperation = async () => {
    if (!this.state.inputValue || this.state.inputError) {
      return;
    }

    const walletAddressLower = this.address.toLowerCase();
    const underlyingToken = this.state.underlyingToken;
    const dmmToken = this.state.dmmToken;

    const allowance = this.state.isMinting ? this.state.underlyingAllowance : this.state.dmmAllowance;

    this.setState({
      isWaitingForSignature: true,
    });

    this.setState({
      isWaitingForSignature: true,
      isWaitingForApprovalToMine: false,
    });

    let receiptPromise;
    if (this.state.isMinting) {
      if (dmmToken.underlyingTokenAddress.toLowerCase() === WETH.address.toLowerCase()) {
        receiptPromise = DmmTokenService.mintViaEther(dmmToken.address, walletAddressLower, this.state.inputValue);
      } else {
        receiptPromise = DmmTokenService.mint(dmmToken.address, walletAddressLower, this.state.inputValue);
      }
    } else {
      receiptPromise = DmmTokenService.redeem(dmmToken.address, walletAddressLower, this.state.inputValue);
    }

    const isSuccessful = await receiptPromise
      .on('transactionHash', transactionHash => {
        if (this.state.isMinting) {
          // this.add(transactionHash); - check  slack
        }
        // This is purposefully NOT awaited. It's a "side-effect" promise
        DmmTokenService.addNewTokensToTotalTokensPurchased(transactionHash);
        this.setState({
          isWaitingForSignature: false,
          isWaitingForActionToMine: true,
        });
        return transactionHash;
      })
      .then(async () => {
        this.setState({
          isWaitingForSignature: false,
          isWaitingForActionToMine: false,
        });
        await this.pollForData();
        return true;
      })
      .catch(error => {
        if (error.code === 4001) {
          this.setState({
            isWaitingForSignature: false,
            isWaitingForActionToMine: false,
            snackMessage: 'The transaction was cancelled',
          });
          return false;
        } else {
          console.error("Mint error: ", error);
          this.setState({
            isWaitingForSignature: false,
            isWaitingForActionToMine: false,
            unknownError: 'An unknown error occurred while interacting with DMM',
          });
          return false;
        }
      });

    this.setState({
      isWaitingForSignature: false,
      isWaitingForActionToMine: false,
      value: isSuccessful ? "" : this.state.value,
    });
  };

  componentWillUnmount() {
    clearInterval(this.subscriptionId);
  };

  pollForData = async () => {
    if (!this.state.dmmTokensMap || this.state.counter % 10 === 0) {
      const underlyingToken = this.state.underlyingToken;
      const underlyingToDmmTokensMap = await DmmTokenService.getDmmTokens();
      const dmmToken = underlyingToDmmTokensMap[underlyingToken.address.toLowerCase()];

      console.log(underlyingToken)
      console.log(underlyingToDmmTokensMap)
      console.log(dmmToken)
      
      this.setState({
        dmmToken,
        dmmTokensMap: underlyingToDmmTokensMap,
      });
    }
    this.setState({
      counter: this.state.counter + 1,
    });

    const totalTokensPurchasedPromise = DmmTokenService.getTotalTokensPurchased();
    const tokenValuesPromises = Object.values(this.state.dmmTokensMap).map(token => {
      const mActiveSupplyPromise = DmmTokenService.getActiveSupply(token);
      const mExchangeRatePromise = DmmTokenService.getExchangeRate(token.dmmTokenId);
      const mTotalSupplyPromise = DmmTokenService.getTotalSupply(token);
      return Promise.all([mActiveSupplyPromise, mExchangeRatePromise, mTotalSupplyPromise]);
    });
    // maps to [[activeSupply, exchangeRate, totalSupply]]
    const tokenValues = await Promise.all(tokenValuesPromises.map(async promise => await promise));
    const symbolToActiveSupplyMap = {};
    const symbolToExchangeRateMap = {};
    const symbolToTotalSupplyMap = {};

    await asyncForEach(Object.values(this.state.dmmTokensMap), (token, index) => {
      symbolToActiveSupplyMap[token.symbol] = tokenValues[index][0];
      symbolToExchangeRateMap[token.symbol] = tokenValues[index][1];
      symbolToTotalSupplyMap[token.symbol] = tokenValues[index][2];
    });

    const totalTokensPurchased = await totalTokensPurchasedPromise;

    const dmmTokenSymbol = this.state.dmmToken.symbol;
    this.setState({
      symbolToActiveSupplyMap,
      symbolToExchangeRateMap,
      symbolToTotalSupplyMap,
      activeSupply: symbolToActiveSupplyMap[dmmTokenSymbol],
      exchangeRate: symbolToExchangeRateMap[dmmTokenSymbol],
      totalSupply: symbolToTotalSupplyMap[dmmTokenSymbol],
      totalTokensPurchased,
    });

    if (this.address) {
      this.loadWeb3Data(0).catch(e => {
        console.error("Could not get web3 data due to error: ", e);
        this.setState({
          unknownError: `Could not refresh balances due to error`
        });
      });
    }
  };

  loadWeb3Data = async (retryCount, mostRecentError) => {
    if (retryCount === 5) {
      return Promise.reject(mostRecentError);
    }

    const dmmTokens = Object.values(this.state.dmmTokensMap);
    const tokenValuesPromises = dmmTokens.map(dmmToken => {
      const underlyingToken = tokenAddressToTokenMap[dmmToken.underlyingTokenAddress.toLowerCase()];
      const tokenAllowancePromise = this.getAllowance(underlyingToken, dmmToken);
      const underlyingTokenBalancePromise = this.getBalance(underlyingToken);
      const dmmTokenBalancePromise = this.getBalance(dmmToken);
      return Promise.all([tokenAllowancePromise, underlyingTokenBalancePromise, dmmTokenBalancePromise]);
    });

    Promise.all(tokenValuesPromises)
      .then(async tokenValues => {
        const symbolToUnderlyingAllowanceMap = {};
        const symbolToDmmAllowanceMap = {};
        const symbolToUnderlyingBalanceMap = {};
        const symbolToDmmBalanceMap = {};

        await asyncForEach(tokenValues, async (tokenValue, index) => {
          const symbol = tokenAddressToTokenMap[dmmTokens[index].underlyingTokenAddress].symbol;
          symbolToUnderlyingAllowanceMap[symbol] = await tokenValue[0];
          symbolToDmmAllowanceMap[symbol] = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex');
          symbolToUnderlyingBalanceMap[symbol] = await tokenValue[1];
          symbolToDmmBalanceMap[symbol] = await tokenValue[2];
        });

        const underlyingTokenSymbol = this.state.underlyingToken.symbol;

        const underlyingBalance = symbolToUnderlyingBalanceMap[underlyingTokenSymbol];
        const dmmBalance = symbolToDmmBalanceMap[underlyingTokenSymbol];

        const underlyingAllowance = symbolToUnderlyingAllowanceMap[underlyingTokenSymbol];
        const dmmAllowance = symbolToDmmAllowanceMap[underlyingTokenSymbol];

        this.setState({
          dmmAllowance,
          dmmBalance,
          underlyingAllowance,
          underlyingBalance,
          symbolToUnderlyingAllowanceMap,
          symbolToUnderlyingBalanceMap,
          symbolToDmmAllowanceMap,
          symbolToDmmBalanceMap,
        });
      })
      .catch(error => {
        new Promise((resolve) => {
          const delayInMillis = 200;
          setTimeout(() => resolve.bind(null), delayInMillis);
        }).then(() => this.loadWeb3Data(retryCount + 1, error));
      });
  };

  render() {
    return (
      <div>
          <Swapper
            dmmToken={this.state.dmmToken}
            dmmAllowance={this.state.dmmAllowance}
            dmmBalance={this.state.dmmBalance}
            underlyingToken={this.state.underlyingToken}
            underlyingAllowance={this.state.underlyingAllowance}
            underlyingBalance={this.state.underlyingBalance}
            isLoading={this.state.isLoading}
            isMinting={this.state.isMinting}
            isUnlocked={this.state.isUnlocked}
            isWaitingForSignature={this.state.isWaitingForSignature}
            isWaitingForApprovalToMine={this.state.isWaitingForApprovalToMine}
            doOperation={() => this.doOperation()}
            updateUnderlying={(newTicker) => {
              const underlyingToken = this.state.tokens.find(token => token.symbol === newTicker);
              const dmmToken = this.state.dmmTokensMap[underlyingToken.address.toLowerCase()];
              const underlyingTokenSymbol = underlyingToken.symbol;

              const underlyingBalance = this.state.symbolToUnderlyingBalanceMap[underlyingTokenSymbol];
              const dmmBalance = this.state.symbolToDmmBalanceMap[underlyingTokenSymbol];

              // DMM allowance isn't needed for redeeming, so we don't check/change it here.
              const underlyingAllowance = this.state.symbolToUnderlyingAllowanceMap[underlyingTokenSymbol];
              const exchangeRate = this.state.symbolToExchangeRateMap[dmmToken.symbol];
              const activeSupply = this.state.symbolToActiveSupplyMap[dmmToken.symbol];
              const totalSupply = this.state.symbolToTotalSupplyMap[dmmToken.symbol];

              this.setState({
                underlyingToken,
                dmmToken,
                underlyingBalance,
                dmmBalance,
                exchangeRate,
                underlyingAllowance,
                activeSupply,
                totalSupply
              });
            }}
            updateValue={(val) => this.setState({inputValue: val})}
            setIsMinting={(val) => this.setState({isMinting: val})}
            exchangeRate={this.state.exchangeRate}
            symbolToUnderlyingBalanceMap={this.state.symbolToUnderlyingBalanceMap}
            symbolToDmmBalanceMap={this.state.symbolToDmmBalanceMap}
            dmmTokensMap={this.state.dmmTokensMap}
            activeSupply={this.state.activeSupply}
            totalSupply={this.state.totalSupply}
            tokens={this.state.tokens}
            isLoadingBalances={this.state.isLoadingBalances}
            symbolToExchangeRateMap={this.state.symbolToExchangeRateMap}
          />
      </div>
    );
  }

}

export default withUseTransactionAdder(withUseWeb3React(Earn));
