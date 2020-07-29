import DmmToken from "../abi/DmmToken";
import DmmEther from "../abi/DmmEther";
import DmmWeb3Service from "./DmmWeb3Service";
import NumberUtil from "../utils/NumberUtil";
import Index from "./index";

class DmmTokenService {

  static async getDmmTokens() {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens`,
      {headers: {'Accept': 'application/json'}},
    );
    const tokens = (await response.json())["data"];
    return tokens.reduce((map, token) => {
      token.dmmTokenId = token["dmm_token_id"];
      token.address = token["dmm_token_address"];
      token.imageUrl = token["image_url"];
      token.underlyingTokenAddress = token["underlying_token_address"];
      return {...map, [token.underlyingTokenAddress]: token};
    }, {});
  }

  static async getExchangeRate(dmmTokenId) {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/${dmmTokenId.toString(10)}/exchange-rate`,
      {headers: {'Accept': 'application/json'}},
    );
    return new NumberUtil.BN((await response.json())["data"]["exchange_rate"]);
  }

  static async getActiveSupply(dmmToken) {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/${dmmToken.dmmTokenId.toString(10)}/active-supply`,
      {headers: {'Accept': 'application/json'}},
    );
    const rawBN = new NumberUtil.BN((await response.json())["data"]["active_supply"]);
    return DmmTokenService.convertNumberToWei(dmmToken.decimals, rawBN);
  }

  static async getTotalSupply(dmmToken) {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/${dmmToken.dmmTokenId.toString(10)}/total-supply`,
      {headers: {'Accept': 'application/json'}},
    );
    const rawBN = new NumberUtil.BN((await response.json())["data"]["total_supply"]);
    return DmmTokenService.convertNumberToWei(dmmToken.decimals, rawBN);
  }

  static async getTotalTokensPurchased() {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/total-purchased`,
      {headers: {'Accept': 'application/json'}},
    );
    const rawBN = new NumberUtil.BN((await response.json())["data"]["total_tokens_purchased"]);
    return DmmTokenService.convertNumberToWei(18, rawBN);
  }

  static async addNewTokensToTotalTokensPurchased(transactionHash) {
    const response = await fetch(
      `${Index.baseUrl}/v1/dmm/tokens/add-total-purchased-by-hash/${transactionHash}`,
      {headers: {'Accept': 'application/json'}, method: 'POST'},
    );
    const rawBN = new NumberUtil.BN((await response.json())["data"]["total_tokens_purchased"]);
    return DmmTokenService.convertNumberToWei(18, rawBN);
  }

  static convertNumberToWei(decimals, amountBN) {
    if (decimals === 18) {
      return amountBN;
    } else if (decimals > 18) {
      const diff = decimals - 18;
      return amountBN.div(new NumberUtil.BN(10).pow(new NumberUtil.BN(diff)));
    } else /* decimals < 18 */ {
      const diff = 18 - decimals;
      return amountBN.mul(new NumberUtil.BN(10).pow(new NumberUtil.BN(diff)));
    }
  }

  static mint(dmmTokenAddress, owner, underlyingAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return dmmToken.methods.mint(underlyingAmount.toString(10)).send({from: owner});
  }

  static mintViaEther(dmmTokenAddress, owner, underlyingAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmEther, dmmTokenAddress);
    return dmmToken.methods.mintViaEther().send({from: owner, value: underlyingAmount.toString(10)});
  }

  static redeem(dmmTokenAddress, owner, dmmAmount) {
    const dmmToken = new DmmWeb3Service.instance.web3.eth.Contract(DmmToken, dmmTokenAddress);
    return dmmToken.methods.redeem(dmmAmount.toString(10)).send({from: owner});
  }

}

export default DmmTokenService;