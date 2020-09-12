import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { transparentize } from 'polished'

const SummaryWrapper = styled.div`
  color: ${({ error, brokenTokenWarning, theme }) =>
  error ? theme.salmonRed : brokenTokenWarning ? theme.black : theme.black};
  font-size: 0.75rem;
  text-align: center;
  margin-top: 0rem;
  padding-top: 1rem;
`

const SummaryWrapperContainer = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.chaliceGray};
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  img {
    height: 0.75rem;
    width: 0.75rem;
  }
`

const Details = styled.div`
  background-color: ${({ theme }) => theme.concreteGray};
  /* padding: 1.25rem 1.25rem 1rem 1.25rem; */
  border-radius: 1rem;
  font-size: 0.75rem;
  margin: 1rem 0.5rem 0 0.5rem;
`

const ErrorSpan = styled.span`
  font-size: 0.75rem;
  line-height: 0.75rem;
  height: 0.75rem;

  color: ${({ isError, theme }) => isError && theme.salmonRed};
  ${({ slippageWarning, highSlippageWarning, theme }) =>
  highSlippageWarning
    ? css`
          color: ${theme.salmonRed};
          font-weight: 600;
        `
    : slippageWarning &&
    css`
          background-color: ${transparentize(0.6, theme.warningYellow)};
          font-weight: 600;
          padding: 0.25rem;
        `}
`

export default function ContextualInfo({
                                         openDetailsText = '',
                                         closeDetailsText = '',
                                         contextualInfo = '',
                                         allowExpand = false,
                                         isError = false,
                                         slippageWarning,
                                         highSlippageWarning,
                                         brokenTokenWarning,
                                         dropDownContent
                                       }) {
  const [showDetails, setShowDetails] = useState(false)
  return !allowExpand ? (
    <SummaryWrapper brokenTokenWarning={brokenTokenWarning}>{contextualInfo}</SummaryWrapper>
  ) : (
    <>
      <SummaryWrapperContainer
        onClick={() => {
          !showDetails &&
          setShowDetails(previousValue => !previousValue)
        }}
      >
        <>
          <ErrorSpan isError={isError} slippageWarning={slippageWarning} highSlippageWarning={highSlippageWarning}>
            {(slippageWarning || highSlippageWarning) && (
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            )}
            {contextualInfo ? contextualInfo : showDetails ? closeDetailsText : openDetailsText}
          </ErrorSpan>
          {/*showDetails ? (
            <ColoredDropup isError={isError} highSlippageWarning={highSlippageWarning} />
          ) : (
            <ColoredDropdown isError={isError} highSlippageWarning={highSlippageWarning} />
          )*/}
        </>
      </SummaryWrapperContainer>
      {showDetails && <Details>{dropDownContent()}</Details>}
    </>
  )
}
