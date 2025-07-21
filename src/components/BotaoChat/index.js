import React from 'react';
import PropTypes from 'prop-types';
import styles from './BotaoChat.module.css';

function BotaoChat({ onClick, children, type = 'button' }) {
  return (
    <button
      type={type}
      className={styles.botaoChat}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

BotaoChat.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default BotaoChat;