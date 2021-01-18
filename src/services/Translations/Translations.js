import React from 'react';
//import PropTypes from 'prop-types';
//import { connect } from 'react-redux';
//import { getLanguage } from '../../redux-store/store';
//import store from '../../redux-store/store';
//import * as languageActionCreators from '../../redux-store/reducers/Language/language-action-creators';
import Languages from './Languages';
import English from './Locales/English';
import Chinese from './Locales/Chinese';

/*
 * Retrieves translations for given language
 */
const languageStore = language => {
  switch (language) {
    case Languages.ENGLISH:
      return English;
    case Languages.CHINESE:
      return Chinese;
    default:
      return English;
  }
};

// Check if an object is a function
const isFunction = obj => !!(obj && obj.constructor && obj.call && obj.apply);

const textFrom = (language, excerptCode, params) => {
  const lang = languageStore(language);
  let content = lang[excerptCode];
  if (isFunction(content)) content = content(...params);

  if (!content) {
    if (language === Languages.ENGLISH) return '';
    content = textFrom(Languages.ENGLISH, excerptCode, params);
  }

  return content;
};

/*
 * Get the text using the current language.
 *
 * NOTE: This is NOT connected to state. Do not use this with
 * components, use `withTranslations`
 *
 * Usage: import text from '...';
 * text(path.to.text) // paths defined in language files
 */
const text = (excerptCode, language, ...params) => {
  return textFrom(language, excerptCode, params);
};

export default text;

/*
 * Generates the props.excerpt() function that is stored in redux state
 * and passed to components that use `withTranslations`
 */
export const generateExcerptFunction = () => (excerptCode, language, ...params) => {
  return textFrom(language, excerptCode, params);
};


/*
 * Provide component and with the current language's text in props.excerpt
 *
 * Usage: export default withTranslations(YourComponent);
 * this.props.excerpt('path.to.text', <optionalParamForText>, <anotherParam>);
 */
export const withTranslations = (WrappedComponent, language) => props => (
  <WrappedComponent
    {...props}
    excerpt={generateExcerptFunction(language)}
  />
);

window.withTranslations = withTranslations;

/*
 * Provide component and with the ability to change the current Language in
 * props.changeLanguage()
 *
 * Usage: export default withChangeLangauge(YourComponent);
 * this.props.changeLanguage(Languages.English)
 */
export const withChangeLanguage = WrappedComponent =>
  withTranslations(props => (
    <WrappedComponent
      {...props}
    />
  ));
