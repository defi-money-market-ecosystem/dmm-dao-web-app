import React from 'react';
import Swapper from './Swapper'
import NumberUtil, {BN} from "../../utils/NumberUtil";
import {tokens, WETH} from "../../models/Tokens";

class Earn extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
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
    }
  }

render() {
    return (
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
        loadWallet={() => this.loadWallet()}
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
    );
  }
}

export default Earn;