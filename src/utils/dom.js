// Tiny DOM helpers used across pages and components — keeps view code declarative
// without pulling in a framework.

/**
 * Create an element.
 * @param {string} tag
 * @param {Object} props - attributes; special keys: class, html, dataset, on* handlers
 * @param {(Node|string)[]|Node|string} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, value);
    }
  }

  appendChildren(node, children);
  return node;
}

export function appendChildren(node, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Escape user-generated text before interpolating into an innerHTML string. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Remove all children from a node. */
export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Replace the contents of a node with new content. */
export function setContent(node, content) {
  clearNode(node);
  appendChildren(node, content);
}
