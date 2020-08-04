import React from 'react';
import {CircularProgress} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import NumberUtil, {fromDecimalToBN, humanize} from "../../utils/NumberUtil";
import {WETH} from "../../models/Tokens";
import {createMuiTheme, ThemeProvider} from '@material-ui/core/styles';

import ArrowForward from '@material-ui/icons/ArrowForward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import styles from './SwapPanel.module.css';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#ffffff'
    },
    secondary: {
      main: '#327ccb'
    },
  },
});

const UNDERLYING = 0;
const DMM = 1;

class SwapPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentFunction: 0,
      underlyingValue: '0',
      underlyingAmount: NumberUtil._0,
      dmmValue: '0',
      dmmAmount: NumberUtil._0,
      inputError: null,
      lastSelected: UNDERLYING,
      underlyingSelectorExpanded: false,
      isInitialLoad: true
    }
  }

  resetNumericState = () => {
    this.setState({
      underlyingValue: '0',
      underlyingAmount: NumberUtil._0,
      dmmValue: '0',
      dmmAmount: NumberUtil._0,
      isInitialLoad: true,
      inputError: null,
    });
  };

  underlyingTokenDecimals = () => this.props.underlyingToken.decimals;

  getNewAmountAndIsInvalid(e) {
    let newAmount = e.target.value.replace(/,/g, '');
    newAmount = newAmount === '' ? '0' : newAmount;

    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    const isInvalid = Number.isNaN(parseFloat(newAmount)) || !regex.test(newAmount);

    const decimals = this.underlyingTokenDecimals();

    const newFormattedAmount = isInvalid || newAmount.includes('.') ?
      newAmount :
      humanize(fromDecimalToBN(newAmount, decimals), decimals, undefined, true);
    //console.log("newAmount ", newAmount, fromDecimalToBN(newAmount, decimals).toString(), humanize(fromDecimalToBN(newAmount, decimals), decimals, undefined, true), newFormattedAmount, isInvalid, newAmount.includes('.'));

    return {newAmount, newFormattedAmount, isInvalid}
  }

  updateUnderlying(e) {
    const {newAmount, newFormattedAmount, isInvalid} = this.getNewAmountAndIsInvalid(e);
    const decimals = this.underlyingTokenDecimals();
    const dmmAmount = isInvalid ? NumberUtil._0 : fromDecimalToBN(parseFloat(newAmount), decimals).mul(NumberUtil._1).div(this.props.exchangeRate);

    this.setState({
      underlyingValue: newFormattedAmount,
      underlyingAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(parseFloat(newAmount), decimals),
      dmmValue: humanize(dmmAmount, decimals, Math.min(8, decimals), true),
      dmmAmount: dmmAmount,
      lastSelected: UNDERLYING,
    });

    if (!isInvalid) {
      if (this.props.isMinting) {
        const underlyingValue = fromDecimalToBN(parseFloat(newAmount), decimals);
        this.props.updateValue(underlyingValue);
      } else {
        this.props.updateValue(dmmAmount);
      }
    }
    this.onInputAmountChange(newAmount);
  }

  updateDmm(e) {
    const {newAmount, newFormattedAmount, isInvalid} = this.getNewAmountAndIsInvalid(e);
    const decimals = this.underlyingTokenDecimals();
    const underlyingValue = !isInvalid ? fromDecimalToBN(parseFloat(newAmount), decimals).mul(this.props.exchangeRate).div(NumberUtil._1) : '0';

    this.setState({
      dmmValue: newFormattedAmount,
      dmmAmount: isInvalid ? NumberUtil._0 : fromDecimalToBN(parseFloat(newAmount), decimals),
      underlyingValue: isInvalid ? '0' : humanize(underlyingValue, decimals, undefined, true),
      underlyingAmount: isInvalid ? NumberUtil._0 : underlyingValue,
      lastSelected: DMM,
    });

    if (!isInvalid) {
      if (this.props.isMinting) {
        this.props.updateValue(underlyingValue);
      } else {
        this.props.updateValue(fromDecimalToBN(parseFloat(newAmount), decimals));
      }
    }
    this.onInputAmountChange(newAmount);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.exchangeRate !== this.props.exchangeRate) {
      if (this.state.lastSelected === UNDERLYING) {
        const dmmAmount = this.state.underlyingAmount.isZero() ? NumberUtil._0 : this.state.underlyingAmount.mul(NumberUtil._1).div(this.props.exchangeRate);
        !this.state.inputError && this.setState({
          dmmValue: humanize(dmmAmount, this.underlyingTokenDecimals(), undefined, true),
          dmmAmount: dmmAmount,
        });
      } else {
        const underlyingAmount = this.state.dmmAmount.isZero() ? NumberUtil._0 : this.state.dmmAmount.mul(this.props.exchangeRate).div(NumberUtil._1);
        !this.state.inputError && this.setState({
          underlyingValue: humanize(underlyingAmount, this.underlyingTokenDecimals(), undefined, true),
          underlyingAmount: underlyingAmount,
        });
      }
    }
  }

  onInputAmountChange = (newVal) => {
    this.setState({
      isInitialLoad: false,
    });

    if (newVal === "") {
      this.setState({
        inputError: undefined,
        value: "",
        inputValue: NumberUtil._0,
      });
      return;
    }

    const value = parseFloat(newVal);
    const regex = /^[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)$/;
    if (Number.isNaN(value) || !regex.test(newVal)) {
      this.setState({
        inputError: "Must be a valid number",
      });
      return;
    }

    const balance = this.props.isMinting ? this.props.underlyingBalance : this.props.dmmBalance;

    const underlyingToken = this.props.underlyingToken;
    const maxDecimals = Math.min(underlyingToken.decimals, 8);
    if (value <= 0) {
      this.setState({
        isInitialLoad: true
      });
    } else if (value < 1 && this.props.isMinting && underlyingToken.address.toLowerCase() === WETH.addressLower) {
      this.setState({
        inputError: `Must be >= 1`
      });
    } else if (value.toString().includes("e+")) {
      this.setState({
        inputError: `Number is too large`
      });
    } else if (value.countDecimals() > maxDecimals) {
      this.setState({
        inputError: `Must only have up to ${maxDecimals} decimals`
      });
    } else if (balance.lt(fromDecimalToBN(value, underlyingToken.decimals))) {
      this.setState({
        inputError: `Insufficient balance`
      });
    } else {
      this.setState({
        inputError: undefined,
      });
    }
  };

  onSelectMax() {
    const underlyingAmount = this.props.isMinting ?
      this.props.underlyingBalance :
      this.props.dmmBalance.mul(this.props.exchangeRate).div(NumberUtil._1);

    const dmmAmount = this.props.isMinting ?
      this.props.underlyingBalance.mul(NumberUtil._1).div(this.props.exchangeRate) :
      this.props.dmmBalance;

    const decimals = this.underlyingTokenDecimals();

    this.setState({
      underlyingValue: humanize(underlyingAmount, decimals),
      underlyingAmount: underlyingAmount,
      dmmValue: humanize(dmmAmount, decimals),
      dmmAmount: dmmAmount,
      lastSelected: this.props.isMinting ? UNDERLYING : DMM,
    });

    this.props.updateValue(this.props.isMinting ? this.props.underlyingBalance : this.props.dmmBalance);

    const newInput = this.props.isMinting ?
      humanize(underlyingAmount, decimals, undefined) :
      humanize(dmmAmount, decimals, undefined);

    this.onInputAmountChange(newInput)
  }

  setUnderlyingTicker(ticker) {
    this.props.updateUnderlying(ticker);
    this.setState({underlyingSelectorExpanded: false});
    this.resetNumericState();
  }

  getLeftSideInputField = (isMinting) => {
    return (
      <div className={styles.inputWrapper}>
        <input
          className={styles.dmmInput}
          onChange={(e) => isMinting ? this.updateUnderlying(e) : this.updateDmm(e)}
          value={isMinting ? this.state.underlyingValue : this.state.dmmValue}
        />
        <div
          className={`${styles.underlyingSelector} ${this.state.underlyingSelectorExpanded && styles.expanded}`}
          onClick={() => this.setState({underlyingSelectorExpanded: !this.state.underlyingSelectorExpanded})}>
          <div className={styles.asset}>
            {isMinting ? this.props.underlyingToken.symbol : this.props.dmmToken.symbol}
          </div>
          <ArrowDropDown/>
          <div
            className={`${styles.underlyingOption} ${styles.first}`}
            onClick={(e) => {
              this.state.underlyingSelectorExpanded && this.setUnderlyingTicker(this.props.underlyingToken.symbol);
              this.state.underlyingSelectorExpanded && e.stopPropagation();
            }}>
            {isMinting ? this.props.underlyingToken.symbol : this.props.dmmToken.symbol}
          </div>
          <div>
            {this.props.tokens.filter(token => token.symbol !== this.props.underlyingToken.symbol).map(token => {
              return (
                <div
                  className={styles.underlyingOption}
                  onClick={(e) => {
                    const targetedSymbol = isMinting ? e.target.innerHTML : e.target.innerHTML.substring(1);
                    this.state.underlyingSelectorExpanded && this.setUnderlyingTicker(targetedSymbol);
                    this.state.underlyingSelectorExpanded && e.stopPropagation();
                  }}>
                  {isMinting ? token.symbol : `m${token.symbol}`}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  getRightSideInputView = (isMinting) => {
    // It's possible the dmmToken isn't available yet when we call this fn. That's why we prefix the "m" in the JSX.
    return (
      <div className={styles.inputWrapper}>
        <input
          onChange={(e) => isMinting ? this.updateUnderlying(e) : this.updateDmm(e)}
          value={isMinting ? this.state.dmmValue : this.state.underlyingValue}
        />
        <div className={styles.asset}>
          {isMinting ? `m${this.props.underlyingToken.symbol}` : this.props.underlyingToken.symbol}
        </div>
      </div>
    );
  };

  render() {
    const isMinting = this.props.isMinting;
    const allowance = isMinting ? this.props.underlyingAllowance : this.props.dmmAllowance;
    const actionLeftInputView = this.getLeftSideInputField(isMinting);
    const actionRightInputView = this.getRightSideInputView(isMinting);
    const dmmToken = this.props.dmmToken;

    console.log('test')
    console.log(dmmToken)

    let metadataSection;
    if (dmmToken) {
      const targetPrecision = dmmToken.underlyingTokenAddress === WETH.addressLower ? 2 : 0;
      metadataSection = (
        <div className={styles.supplyWrapper}>
          <div className={`${styles.supply} ${styles.active}`}>
            <div className={styles.name}>Active supply:</div>
            <div className={styles.amount}>
              {humanize(this.props.activeSupply, 18, targetPrecision, true)}
              <span className={styles.gray}>&nbsp;{dmmToken.symbol}</span></div>
          </div>
          <div className={`${styles.supply} ${styles.total}`}>
            <div className={styles.name}>Total supply:</div>
            <div className={styles.amount}>
              {humanize(this.props.totalSupply, 18, 0, true)}
              <span className={styles.gray}>&nbsp;{dmmToken.symbol}</span>
            </div>
          </div>
        </div>
      );
    } else {
      metadataSection = (<div/>);
    }

    const actionButtonHelperTooltip = this.props.isWaitingForSignature ?
      'Awaiting signature from wallet' :
      this.props.isWaitingForApprovalToMine ? `Your tokens are unlocking. After being unlocked, they can be used to mint ${dmmToken.symbol}`
        : '';

    return (
      <div className={`${styles.SwapPanel} ${this.props.disabled && styles.disabled}`}>
        <ThemeProvider theme={theme}>
          <div className={styles.mintOrRedeem}>
            <Tabs value={this.state.currentFunction} onChange={(e, newSelectedIndex) => {
              this.setState({currentFunction: newSelectedIndex});
              this.resetNumericState();
              this.props.setIsMinting(newSelectedIndex === 0)
            }} aria-label="Swap Tabs">
              <Tab label="Mint"/>
              <Tab label="Redeem"/>
            </Tabs>
          </div>
          <div className={styles.helperText}>
            {
              this.props.isMinting ?
                (<div>Mint your tokens into mTokens so it can earn interest.</div>) :
                (<div>Redeem your mTokens back to tokens with interest.</div>)
            }
          </div>
          <div className={styles.inputForm}>
            <div className={styles.inputFormWrapper}>
              <div className={styles.underlyingSection}>
                <div
                  className={styles.maxBalance}
                  onClick={() => this.onSelectMax()}
                >
                  MAX
                </div>
                {actionLeftInputView}
              </div>
              <div className={styles.arrow}>
                <div className={styles.rightArrow}>
                  <ArrowForward/>
                </div>
                <div className={styles.downArrow}>
                  <ArrowDownward/>
                </div>
              </div>
              <div className={styles.dmmSection}>
                {actionRightInputView}
              </div>
            </div>
          </div>
          <div className={styles.errorSection}>
            <div>{this.state.inputError}</div>
          </div>
          <div className={styles.submit}>
            {metadataSection}
            {this.props.isWaitingForSignature ? (
              (this.props.isMinting && allowance.eq(NumberUtil._0)) ? (
                <Tooltip title={actionButtonHelperTooltip}>
                  <Button className={`${styles.submitButton} ${styles.loading}`} disabled={false}>
                    <CircularProgress color={'primary'}/>Unlocking
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip
                  title={this.props.isWaitingForSignature ? 'Awaiting signature from wallet' : `Waiting for your assets to ${isMinting ? 'mint' : 'redeem'}.`}>
                  <Button className={`${styles.submitButton} ${styles.loading}`} disabled={false}>
                    <CircularProgress color={'primary'}/> {this.props.isMinting ? "Minting" : "Redeeming"}
                  </Button>
                </Tooltip>
              )
            ) : (
              <Button
                className={[styles.submitButton, (this.state.isInitialLoad || !!this.state.inputError || this.state.underlyingValue === '0') ? styles.submitButtonDisabled : '']}
                onClick={() => this.props.onDoOperation()}
                disabled={!!this.state.inputError || this.state.underlyingValue === '0'}>
                {this.props.isMinting ? "Mint" : "Redeem"}
              </Button>
            )}
          </div>
        </ThemeProvider>
      </div>
    );
  }
}

export default SwapPanel;