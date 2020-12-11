import React from 'react'

import Button from '@material-ui/core/Button'
import Web3Status from '../Web3Status'
import './header.css'
import DMMLogo from '../../assets/images/dmm-logo.svg'
import FiatAdapter from 'fiat-adapter'

class Header extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      fiatAdapterOpen: false
    }
  }

  render() {
    return (
      <div className={'navbar'}>
        <div className={'content'}>
          <div className={'logoWrapper'}>
            <div className={'logo'}>
              <img src={DMMLogo} alt={'DMM Logo'}/>
            </div>
            <div className={'logoText'}>
              DMM <span className={'swapText'}/>
            </div>
          </div>
          <div className={'buttonsWrapper'}>
            <div className={'purchaseCryptoButton'}>
              {!this.props.hideBuy && (
                <Button className={'loadWallet'} onClick={() => this.setState({ fiatAdapterOpen: true })}>
                  Buy Crypto
                </Button>
              )}
            </div>
            <div className={'connectWalletButton'}>
              <Web3Status/>
            </div>
          </div>
        </div>
        <FiatAdapter
          open={this.state.fiatAdapterOpen}background
          onClose={() => this.setState({ fiatAdapterOpen: false })}
          allowedCryptos={['DAI', 'USDC']}
        />
      </div>
    )
  }
}

export default Header