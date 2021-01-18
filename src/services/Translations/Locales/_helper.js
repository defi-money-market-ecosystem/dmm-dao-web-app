/*eslint-disable */

export const h1 = title => (title ? `<h1>${title}</h1>` : '');
export const h2 = title => (title ? `<h2>${title}</h2>` : '');
export const bold = text => (text ? `<b>${text}</b>` : '');
export const a = (text, href, target) => (text ? `<a href=${href} target=${target}>${text}</a>` : '');