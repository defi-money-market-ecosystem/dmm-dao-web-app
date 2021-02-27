import React from 'react'
import ExchangePage from '../../components/ExchangePage'

export default function Swap({ initialCurrency, params, language }) {
  return <ExchangePage initialCurrency={initialCurrency} params={params} language={language} />
}
