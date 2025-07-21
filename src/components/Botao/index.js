import React from 'react';
import PropTypes from 'prop-types';
import styles from './Botao.module.css';

function Botao({ onClick, children, type = 'button' }) {
  return (
    <button
      type={type}
      className={styles.botao}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

Botao.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Botao;