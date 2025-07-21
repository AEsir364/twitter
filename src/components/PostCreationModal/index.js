import React from 'react';
import PropTypes from 'prop-types';
import styles from './PostCreationModal.module.css';
import PostInput from '../PostInput';
import { FiX } from 'react-icons/fi';

function PostCreationModal({ isOpen, onClose, currentUserUid, currentUserProfileName, currentUserPhotoURL }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX size={24} />
        </button>
        <h2 className={styles.modalTitle}>Criar nova publicação</h2>
        <PostInput
          currentUserUid={currentUserUid}
          currentUserProfileName={currentUserProfileName}
          currentUserPhotoURL={currentUserPhotoURL}
          onPostCreated={onClose}
        />
      </div>
    </div>
  );
}

PostCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUserUid: PropTypes.string,
  currentUserProfileName: PropTypes.string,
  currentUserPhotoURL: PropTypes.string,
};

export default PostCreationModal;