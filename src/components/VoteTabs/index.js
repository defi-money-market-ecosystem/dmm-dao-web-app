import React, { useCallback } from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { darken, transparentize } from 'polished'

const tabOrder = [
  {
    path: '/governance/proposals',
    textKey: 'Proposals',
    regex: /\/governance\/proposals/,
  },
  {
    path: '/governance/overview',
    textKey: 'Overview',
    regex: /\/governance\/overview/,
  },
  {
    path: '/asset-introducers/purchase',
    textKey: 'Assets',
    regex: /\/asset-introducers\/purchase/,
  },
]

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  text-align: center;
  height: 2.5rem;
  margin-bottom: 1rem;
  z-index: 100;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  align-items: center;
  justify-content: center;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.black};
  font-size: 1rem;
  box-sizing: border-box;
  font-weight: 700;
  margin: 8px 20px;
  font-size: 16px;

  :hover {
  
  }
  
  ${({ disabled }) => disabled && `
    cursor: default;
    pointer-events: none;
  `}

  &.${activeClassName} {
    color: ${({ theme }) => theme.primary};
    border-bottom: 2px solid ${({ theme }) => theme.primary};
    :focus
    
  }
`

function VoteTabs({ location: { pathname }, history }) {
  const { t } = useTranslation()

  // const { account } = useWeb3React()

  const navigate = useCallback(
    direction => {
      const tabIndex = tabOrder.findIndex(({ regex }) => pathname.match(regex))
      history.push(tabOrder[(tabIndex + tabOrder.length + direction) % tabOrder.length].path)
    },
    [pathname, history]
  )

  return (
    <>
      <Tabs>
        {tabOrder.map(({ path, textKey, regex, disabled }) => (
          <StyledNavLink disabled={disabled} key={path} to={path} isActive={(_, { pathname }) => pathname.match(regex)}>
            {t(textKey)}
          </StyledNavLink>
        ))}
      </Tabs>
    </>
  )
}

export default withRouter(VoteTabs)
