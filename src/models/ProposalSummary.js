import moment from 'moment'
import React from 'react'
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

  static formatStatus(status) {
    return status.substring(0, 1) + status.substring(1).toLowerCase()
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

  mostRecentDateText(currentBlock) {
    const momentFormatterDate = 'l'
    const momentFormatterTime = 'LT'
    if (this.proposalStatus === ProposalSummary.statuses.CANCELLED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal was cancelled at ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal was cancelled on ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.QUEUED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal has been queued for execution since ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal has been queued for execution since ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.EXECUTED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal was executed at ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal was executed on ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.EXPIRED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal expired at ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal expired on ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.PENDING) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal is awaiting the vote to start since ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal is awaiting the vote to start since ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.SUCCEEDED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal was passed at ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal was passed on ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.DEFEATED) {
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        return `Proposal was defeated at ${moment(this.lastUpdatedTimestamp).format(momentFormatterTime)}`
      } else {
        return `Proposal was defeated on ${moment(this.lastUpdatedTimestamp).format(momentFormatterDate)}`
      }
    } else if (this.proposalStatus === ProposalSummary.statuses.ACTIVE) {
      const durationSeconds = (this.endBlock - (currentBlock || this.startBlock)) * 15
      const endTimestamp = moment().add(durationSeconds, 'seconds')
      if (moment(this.lastUpdatedTimestamp).isSame(moment(), 'day')) {
        const startTimestampFormatted = moment(this.lastUpdatedTimestamp).format(momentFormatterTime)
        const endTimestampFormatted = endTimestamp.format(momentFormatterDate)
        return `Voting started at ${startTimestampFormatted} and ends on roughly ${endTimestampFormatted}`
      } else {
        const startTimestampFormatted = moment(this.lastUpdatedTimestamp).format(momentFormatterDate)
        if (endTimestamp.isSame(moment(), 'day')) {
          const endTimestampFormatted = endTimestamp.format(momentFormatterTime)
          return `Voting started on ${startTimestampFormatted} and ends at roughly ${endTimestampFormatted}`
        } else {
          const endTimestampFormatted = endTimestamp.format(momentFormatterDate)
          return `Voting started on ${startTimestampFormatted} and ends on roughly ${endTimestampFormatted}`
        }
      }

    }
  }

  proposalStatusFormatted() {
    return ProposalSummary.formatStatus(this.proposalStatus)
  }

  isVotingDisabled() {
    return !!this.account?.proposalVoteInfo?.voteStatus && this.account.proposalVoteInfo.voteStatus !== AccountProposalVoteInfo.statuses.VOTE
  }

}