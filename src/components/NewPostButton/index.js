import React from 'react';
import PropTypes from 'prop-types';
import styles from './NewPostButton.module.css';
import { FiPlus } from 'react-icons/fi';

function NewPostButton({ onNewPostClick }) {
  return (
    <button className={styles.newPostButton} onClick={onNewPostClick}>
      <FiPlus size={24} />
    </button>
  );
}

NewPostButton.propTypes = {
  onNewPostClick: PropTypes.func.isRequired,
};

export default NewPostButton;