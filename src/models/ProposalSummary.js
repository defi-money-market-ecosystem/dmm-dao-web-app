import moment from 'moment'
import { AccountSummary } from './AccountSummary'
import { AccountProposalVoteInfo } from './AccountProposalVoteInfo'

export class ProposalSummary {

  static statuses = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    DEFEATED: 'DEFEATED',
    SUCCEEDED: 'SUCCEEDED',
    QUEUED: 'QUEUED',
    EXPIRED: 'EXPIRED',
    EXECUTED: 'EXECUTED'
  }

  static formatStatus(status, t) {
    return t('vote.'+status);
  }

  constructor({ proposal_id, title, description, start_block, end_block, start_timestamp, end_timestamp, proposal_status, last_updated_timestamp }) {
    this.proposalId = proposal_id
    this.title = title
    this.description = description
    this.startBlock = start_block
    this.endBlock = end_block
    this.startTimestamp = !!start_timestamp ? moment(start_timestamp) : null
    this.endTimestamp = !!end_timestamp ? moment(end_timestamp) : null
    this.proposalStatus = proposal_status
    this.lastUpdatedTimestamp = !!last_updated_timestamp ? moment(last_updated_timestamp) : null
    this.account = null
  }

  withAccount(account) {
    if (account) {
      this.account = new AccountSummary(account)
    } else {
      this.account = null
    }
    return this
  }

  mostRecentDateText(currentBlock, t) {
    const momentFormatterDate = 'l'
    const momentFormatterTime = 'LT'
    if (this.proposalStatus === ProposalSummary.statuses.CANCELLED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalCancelledAt', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalCancelledOn', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.QUEUED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalQueued', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalQueued', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.EXECUTED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalExecutedAt', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalExecutedOn', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.EXPIRED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalExpiredAt', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalExpiredAt', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.PENDING) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalPending', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalPending', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.SUCCEEDED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalPassedAt', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalPassedAt', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.DEFEATED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return t('vote.proposalDefeatedAt', moment(this.lastUpdatedTimestamp).format(momentFormatterTime))
      } else {
        return t('vote.proposalDefeatedAt', moment(this.lastUpdatedTimestamp).format(momentFormatterDate))
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.ACTIVE) {
      const durationSeconds = (this.endBlock - (currentBlock || this.startBlock)) * 15
      const endTimestamp = moment().add(durationSeconds, 'seconds')
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        const startTimestampFormatted = moment(this.lastUpdatedTimestamp).format(momentFormatterTime)
        const endTimestampFormatted = endTimestamp.format(momentFormatterDate)
        return t('vote.startedAt', {startTimestampFormatted: startTimestampFormatted, endTimestampFormatted: endTimestampFormatted})
      } else {
        const startTimestampFormatted = moment(this.lastUpdatedTimestamp).format(momentFormatterDate)
        if (endTimestamp.isSame(moment(), 'day')) {
          const endTimestampFormatted = endTimestamp.format(momentFormatterTime)
          return t('vote.startedOn', {startTimestampFormatted: startTimestampFormatted, endTimestampFormatted: endTimestampFormatted})
        } else {
          const endTimestampFormatted = endTimestamp.format(momentFormatterDate)
          return t('vote.startedOn', {startTimestampFormatted: startTimestampFormatted, endTimestampFormatted: endTimestampFormatted})
        }
      }

    }
  }

  proposalStatusFormatted(t) {
    return ProposalSummary.formatStatus(this.proposalStatus, t)
  }

  isVotingDisabled() {
    return !!this.account?.proposalVoteInfo?.voteStatus && this.account.proposalVoteInfo.voteStatus !== AccountProposalVoteInfo.statuses.VOTE
  }

}