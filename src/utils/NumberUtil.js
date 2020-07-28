import Web3 from 'web3'
import Web3Utils from 'web3-utils'

export const BN = Web3Utils.BN;

export const _0 = new BN(0);
export const _1 = new BN('1000000000000000000');
export const _10 = new BN(10);
export const humanPrecision = 6;

export const MAX_UINT256 = new BN('2').pow(new BN('256')).sub(new BN('1'));
export const MAX_INT256 = new BN('2').pow(new BN('255')).sub(new BN('1'));
export const MIN_INT256 = new BN('2').pow(new BN('255')).mul(new BN('-1'));

export const humanize = (bn, bnPrecision, targetPrecision, format, minDecimals) => {
  if (typeof bn === 'number') {
    bn = new BN(bn);
  } else if (typeof bn === 'string') {
    bn = new BN(bn);
  }

  if (!targetPrecision && targetPrecision !== 0) {
    targetPrecision = humanPrecision;
  }

  if (!bnPrecision && bnPrecision !== 0) {
    bnPrecision = 18;
  }
  // const truncationAmount = Math.max(bnPrecision - targetPrecision, 0);
  // if (truncationAmount === 0) {
  //   if (bnPrecision <= 18) {
  //     return Web3.utils.fromWei(bn.mul(new BN(_10).pow(new BN(18 - bnPrecision))));
  //   } else {
  //     return Web3.utils.fromWei(bn.div(new BN(_10).pow(new BN(bnPrecision - 18))));
  //   }
  // }

  const baseRate = new BN(_10).pow(new BN(bnPrecision - targetPrecision));
  let neededPower;
  if (bnPrecision === 18) {
    neededPower = new BN(1);
  } else if (bnPrecision < 18) {
    neededPower = new BN(10).pow(new BN(18 - bnPrecision))
  } else /* bnPrecision > 18 */ {
    neededPower = new BN(10).pow(new BN(bnPrecision - 18))
  }

  const truncatedNumber = bn.div(baseRate).mul(baseRate);

  let decimalString;
  if (bnPrecision > 18) {
    decimalString = Web3.utils.fromWei(truncatedNumber.div(neededPower));
  } else {
    decimalString = Web3.utils.fromWei(truncatedNumber.mul(neededPower));
  }

  if (format) {
    return parseFloat(decimalString).toLocaleString("en-US", {
      maximumFractionDigits: targetPrecision,
      minimumFractionDigits: minDecimals || 0,
      useGrouping: true,
    });
  } else {
    return decimalString
  }
};

export const fromDecimalToBN = (value, bnPrecision) => {
  if (typeof value === 'number') {
    value = value + '';
  }

  const bn = new BN(Web3.utils.toWei(value));
  if (bnPrecision && bnPrecision !== 18) {
    return bn.div(_10.pow(new BN(18 - bnPrecision)));
  } else {
    return bn;
  }
};

// eslint-disable-next-line
Number.prototype.countDecimals = function () {
  if (Math.floor(this.valueOf()) === this.valueOf()) return 0;
  const string = this.toString();
  if (string.includes('e-')) {
    return Number.parseInt(string.substring(string.indexOf('e-') + 2));
  } else {
    return string.split(".")[1].length || 0;
  }
};

export default {
  _0,
  _1,
  BN,
  MAX_UINT256,
  MAX_INT256,
  MIN_INT256,
};