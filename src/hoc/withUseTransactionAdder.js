import React from "react";
import { useTransactionAdder } from '../contexts/Transactions'

export default function withUseTransactionAdder(Component) {
  return function WrappedComponent(props) {
    const { chainId, add, hash } = useTransactionAdder()
    return <Component {...props} add={add} chainId={chainId} hash={hash} />;
  }
}