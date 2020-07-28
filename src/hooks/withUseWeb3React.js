import React from "react";
import { useWeb3React } from '../hooks'

export default function withUseWeb3React(Component) {
  return function WrappedComponent(props) {
    const value = useWeb3React();
    return <Component {...props} web3value={value} />;
  }
}