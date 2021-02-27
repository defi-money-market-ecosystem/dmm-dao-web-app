/*eslint-disable */

const h1 = title => (title ? `<h1>${title}</h1>` : '');
const h2 = title => (title ? `<h2>${title}</h2>` : '');
const bold = text => (text ? `<b>${text}</b>` : '');
const a = (text, href, target) => (text ? `<a href=${href} target=${target}>${text}</a>` : '');

/*
 * Rules for translating:
 * - Only change text in quotes ("", '' or `)
 * - When you see something like h1('Welcome') ONLY change what is in the quotes
 *    - h1()        Makes text Header text (very large)
 *    - h2()        Makes text Secondary Header text (very large, not quite as large as h1)
 *    - bold()      Makes text bold
 */

export default {
  'swap.invalidInput': 'Not a valid input value', //TODO
  'swap.insufficientBalance': 'Insufficient Balance', //TODO
  'swap.unlockTokenCont': 'Please unlock token to continue.', //TODO
  'swap.insufficientBalanceBuffer': 'For ETH, you must leave at least 0.05 in your wallet to pay for the transaction.', //TODO
  'swap.insufficientLiquidity': 'Insufficient liquidity.', //TODO
  'swap.orderBooksLoading': 'Exchange is loading.', //TODO
  'swap.estimated': '估价',
  'swap.unsupportedDevice': 'This device is not supported for submitting orders. Please use a different wallet.', //TODO
  'swap.submissionError': 'There was an error submitting your order. Please try again', //TODO
  'swap.wrapping': 'Wrapping', //TODO
  'swap.awaitingSignature': 'Awaiting Signature', //TODO
  'swap.swap': 'Swap', //TODO
  'swap.connectToWallet': '连接钱包',
  'swap.sendAnyway': 'Send Anyway', //TODO
  'swap.send': 'Send', //TODO
  'swap.swapAnyway': 'Swap anyway', //TODO
  'swap.input': '输入',
  'swap.output': '输出',
  'swap.exchangeRate': '汇率',

  'farm.farmNotActive': 'Farming is not active', //TODO
  'farm.inputNotValid': 'Not a valid input value', //TODO
  'farm.title': 'Farming 信息',
  'farm.confirmWithdraw': 'Confirm Withdraw Farming', //TODO
  'farm.withdrawInfo': (params) => `You are withdrawing your active farm, which incurs a ${params.feesByToken} fee on the amount of ${params.currencyASymbol} and ${params.currencyBSymbol} you deposited. The expected fee is about ${params.feeAmountAFormatted} ${params.currencyASymbol} and ${params.feeAmountBFormatted} ${params.currencyBSymbol}.`, //TODO
  'farm.deny': 'Deny', //TODO
  'farm.confirm': 'Confirm', //TODO
  'farm.aprTitle': (key) => `${key} APR`, //TODO
  'farm.leftForRedemption': '赎回剩余',
  'farm.yourWallet': '您的钱包',
  'farm.earningNetAPR': 'Earning a net APR of', //TODO
  'farm.deposit': (extra) => `存入 ${ extra }`,
  'farm.exchangeRate': '汇率',
  'farm.currentPoolSize': '当前',
  'farm.yourPoolShare': '您的股票池',
  'farm.dmgRewardBalance': '您累计的 DMG 奖励',
  'farm.harvestFee': '收获费',
  'farm.addToFarm': 'Add to Farm', //TODO
  'farm.farm': 'Farm', //TODO
  'farm.approveFarming': ' 批准 Farming',
  'farm.endFarming': '结束 Farming',
  'farm.withdraw': 'Withdraw', //TODO
  'farm.insufficientBalanceForSymbol': (symbol) => `Insufficient Balance for ${symbol}`, //TODO
  'farm.mustUnlock': (symbol) => `请您解锁 USDC ${symbol} 以开始 Farming`,

  'vote.activateWallet': 'Activate Wallet', //TODO
  'vote.votes': '投票',
  'vote.yourWallet': '您的钱包',
  'vote.becomeIntroducer': 'Become an Asset Introducer',
  'vote.governanceProposals': '治理提案',
  'vote.invalidID': 'Invalid Proposal ID', //TODO
  'vote.FOR': 'FOR', //TODO
  'vote.AGAINST': 'AGAINST', //TODO
  'vote.NO_VOTE': 'NO VOTE', //TODO
  'vote.VOTE': 'VOTE', //TODO
  'vote.proposalCancelledAt': (time) => `Proposal was cancelled at ${time}`, //TODO
  'vote.proposalCancelledOn': (date) => `Proposal was cancelled on ${date}`, //TODO
  'vote.proposalQueued': (date) => `Proposal has been queued for execution since ${date}`, //TODO
  'vote.proposalExecutedAt': (time) => `Proposal was executed at ${time}`, //TODO
  'vote.proposalExecutedOn': (date) => `Proposal was executed on ${date}`, //TODO
  'vote.proposalExpiredAt': (time) => `Proposal expired at ${time}`, //TODO
  'vote.proposalExpiredOn': (date) => `Proposal expired on ${date}`, //TODO
  'vote.proposalPending': (date) => `Proposal is awaiting the vote to start since ${date}`, //TODO
  'vote.proposalPassedAt': (time) => `Proposal was passed at ${time}`, //TODO
  'vote.proposalPassedOn': (date) => `Proposal was passed on ${date}`, //TODO
  'vote.proposalDefeatedAt': (time) => `Proposal was defeated at ${time}`, //TODO
  'vote.proposalDefeatedOn': (date) => `Proposal was defeated on ${date}`, //TODO
  'vote.startedAt': (data) => `Voting started at ${data.startTimestampFormatted} and ends roughly ${data.endTimestampFormatted}`, //TODO
  'vote.startedOn': (data) => `Voting started on ${data.startTimestampFormatted} and ends at roughly ${data.endTimestampFormatted}`, //TODO
  'vote.PENDING': 'Pending', //TODO
  'vote.ACTIVE': 'Active', //TODO
  'vote.CANCELLED': 'Cancelled', //TODO
  'vote.DEFEATED': 'Defeated', //TODO
  'vote.SUCCEEDED': 'Succeeded', //TODO
  'vote.QUEUED': 'Queued', //TODO
  'vote.EXPIRED': 'Expired', //TODO
  'vote.EXECUTED': 'Executed', //TODO
  'vote.dmgBalanceTitle': 'DMG 余额',
  'vote.waitingForConfirmation': '您已经确定提交投票，正在等待确认。请等待 确认完成。',
  'vote.mustActivateWallet': '第一次投票，请先激活钱包。为了激活钱包， 跳转到投票仪表板主页，点击 “激活钱包” 按 钮。',
  'vote.castVoteHelper': `请选择下面选项中的一个，发行投票，请记住 提交后可到投票结果不能再改修。`,
  'vote.for': '赞成票',
  'vote.against': '反对票',
  'vote.castYourVote': '确定提交',
  'vote.viewProfile': 'View Profile', //TODO
  'vote.delegatingVotes': 'Delegating Votes To', //TODO

  'proposal.address': 'Address', //TODO
  'proposal.topAddresses': 'Top Addresses', //TODO
  'proposal.overview': 'Overview', //TODO
  'proposal.votes': 'Votes', //TODO
  'proposal.noVotes': (title) => `No votes ${title} the proposal have been cast`, //TODO
  'proposal.viewMore': 'View More', //TODO
  'proposal.details': 'Details', //TODO
  'proposal.history': 'Proposal History', //TODO
  'proposal.for': 'For', //TODO
  'proposal.against': 'Against', //TODO
  'proposal.topVoters': 'Top Voters', //TODO

  'profile.action': 'Action', //TODO
  'profile.blockNumber': 'Block Number', //TODO
  'profile.details': 'Details',
  'profile.overview': 'Overview',
  'profile.rank': 'RANK', //TODO
  'profile.holdings': 'Holdings', //TODO
  'profile.AFFILIATE': 'Affiliate', //TODO
  'profile.Principal': 'Principal', //TODO
  'profile.transactions': 'Transactions', //TODO
  'profile.lost': 'Lost', //TODO
  'profile.received': 'Received', //TODO
  'profile.votes': 'votes', //TODO
  'profile.viewMore': 'View More', //TODO
  'profile.votingHistory': 'Voting History', //TODO
  'profile.dmgBalance': 'DMG Balance', //TODO
  'profile.delegatingTo': 'Delegating To', //TODO
  'profile.self': 'Self', //TODO

  'nft.purchaseAnNFT': '购买 NFT',
  'nft.becomeAnAssetIntroducer': '成为资产介绍者',
  'nft.selectCountry': '选择国家',
  'nft.select': ' 选择...',
  'nft.noCountriesAvailable': 'No countries available', //TODO
  'nft.country': 'Country:', //TODO
  'nft.affiliatesRemaining': 'Affiliates Remaining:', //TODO
  'nft.affiliateNFTPrice': 'Affiliate NFT Price:', //TODO
  'nft.principalsRemaining': 'Principals Remaining:', //TODO
  'nft.principleNFTPrice': 'Principal NFT Price:', //TODO
  'nft.exploreCurrentAssetIntroducers': '探索当前资产介绍者',
  'nft.selectType': '选择类型',
  'nft.affiliate': '附属会员',
  'nft.affiliateDescription': `附属会员是 DMM 生态系统的基本资产介绍人，他 们将对资产引入和发起产生费用，以及获得轻微的 占比的收入。欲了解更多信息，请点击 ${a('此处', "https://medium.com/dmm-dao/introducing-the-first-affiliate-member-and-nfts-into-the-dmm-dao-4392cf3f26d8", '_blank')}。`,
  'nft.principal': '主要会员',
  'nft.currentlyUnavailable': '当前不可用',
  'nft.companyInformation': '公司信息',
  'nft.optional': '选修的',
  'nft.companyName': '公司名称',
  'nft.companyDetails': '公司详情',
  'nft.website': '网页',
  'nft.completePurchase': 'Complete Purchase', //TODO
  'nft.type': 'Type:', //TODO
  'nft.stakemTokens': 'Stake mTokens for discounted purchase', //TODO
  'nft.selectmToken': 'Select mToken to lock up:', //TODO
  'nft.selectPeriod': 'Select lockup period:', //TODO
  'nft.months': 'months', //TODO
  'nft.lockupSize': 'Lockup Size:', //TODO
  'nft.purchaseSize': 'Purchase Size:', //TODO
  'nft.purchase': 'Purchase', //TODO
  'nft.unlockDMG': 'Unlock DMG', //TODO
  'nft.unlock': '解锁',
  'nft.insufficientDMG': 'Insufficient DMG', //TODO
  'nft.insufficient': 'Insufficient', //TODO

  'header.buyCrypto': 'Buy Crypto', //TODO
  'header.connectToWallet': '连接钱包',

  'footer.about': 'About', //TODO
  'footer.docs': '文件',
  'footer.code': 'Code', //TODO

  'navigation.vote': '投票',
  'navigation.earn': '赚币',
  'navigation.farm': 'Farm', //TODO
  'navigation.swap': '交换',

  'inputPanel.unlock': '解锁',
  'inputPanel.pending': 'Pending', //TODO
  'inputPanel.selectToken': 'Select a token', //TODO
  'inputPanel.noTokens': 'No Tokens Found', //TODO
}


/*
 * Add new translations to the bottom of the file. Everytime you reconcile
 * other languages with the English.js file, add a comment saying so at the bottom
 * of the file with the date. This makes keeping track of what needs to be
 * translated much, much easier
 */

