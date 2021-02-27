import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'

import { withTranslations } from '../../services/Translations/Translations';

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const FooterElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
  
  @media (max-width: 800px) {
    margin: 0.8rem;
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.uniswapPink};

  :hover {
    cursor: pointer;
  }
  #link {
    text-decoration-color: ${({ theme }) => theme.uniswapPink};
  }

  #title {
    display: inline;
    font-size: 0.825rem;
    margin-right: 12px;
    font-weight: 400;
    color: #ffffff;
    :hover {
      color: #e0e0e0;
    }
  }
`

function Footer(props) {
  const t = (snippet, prop=null) => props.excerpt(snippet, props.language, prop);

  return (
    <FooterFrame>
      <FooterElement>
        <Title>
          <Link id="link" href="https://defimoneymarket.com/">
            <h1 id="title">{t('footer.about')}</h1>
          </Link>
          <Link id="link" href="https://github.com/defi-money-market-ecosystem/protocol#dmm-protocol">
            <h1 id="title">{t('footer.docs')}</h1>
          </Link>
          <Link id="link" href="https://github.com/defi-money-market-ecosystem">
            <h1 id="title">{t('footer.code')}</h1>
          </Link>
        </Title>
      </FooterElement>
    </FooterFrame>
  )
}

export default withTranslations(Footer);