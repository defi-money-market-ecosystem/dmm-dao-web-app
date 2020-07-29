import * as React from "react";
import {CircularProgress} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import withUseWeb3React from '../../hooks/withUseWeb3React'

import styles from "./Swapper.module.css";
import Tooltip from "@material-ui/core/Tooltip";
import SwapPanel from './SwapPanel';

class Swapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const isWalletLoaded = !!this.props.account;

    const swapPanel = (
      <div>
        <SwapPanel
          isMinting={this.props.isMinting}
          isWaitingForSignature={this.props.isWaitingForSignature}
          isWaitingForApprovalToMine={this.props.isWaitingForApprovalToMine}
          underlyingToken={this.props.underlyingToken}
          underlyingAllowance={this.props.underlyingAllowance}
          underlyingBalance={this.props.underlyingBalance}
          dmmToken={this.props.dmmToken}
          dmmBalance={this.props.dmmBalance}
          dmmAllowance={this.props.dmmAllowance}
          exchangeRate={this.props.exchangeRate}
          onDoOperation={() => this.props.doOperation()}
          updateUnderlying={(newToken) => this.props.updateUnderlying(newToken)}
          updateValue={(val) => this.props.updateValue(val)}
          setIsMinting={(val) => this.props.setIsMinting(val)}
          activeSupply={this.props.activeSupply}
          totalSupply={this.props.totalSupply}
          tokens={this.props.tokens}
          disabled={!isWalletLoaded}
        />
      </div>
    );


    console.log(this.props.dmmToken)
    if (isWalletLoaded && this.props.dmmToken) {
      return (
        <div className={styles.swapperWrapper}>
          {swapPanel}
        </div>
      );
    } else {
      return (
        <div className={styles.swapperWrapper}>
          <div className={styles.overlay}>
            <div className={styles.connectWalletButton}>
              <div className={styles.title}>To get started</div>
              {this.props.isLoading ? (
                <CircularProgress className={styles.progressBar} color={"inherit"}/>
              ) : (
                <Button
                  className={`${styles.loadWallet} ${isWalletLoaded && styles.loaded}`}
                  disabled={isWalletLoaded}
                  onClick={() => this.props.loadWallet()}
                >
                  {isWalletLoaded ? "Wallet Loaded" : "Connect Your Wallet"}
                </Button>
              )}
              <Tooltip
                title={'DMM tokens exist on the Ethereum blockchain. To hold, swap, or transfer DMM tokens you require an Ethereum wallet. MetaMask is a good option that works with most browsers.'}
                arrow
              >
                <div className={styles.whatsAWallet}>
                  <div className={styles.questionIcon}>?</div>
                  <div className={styles.helperText}>What's a wallet?</div>
                </div>
              </Tooltip>
            </div>
          </div>
          {swapPanel}
        </div>
      );
    }
  };
}

export default withUseWeb3React(Swapper);
