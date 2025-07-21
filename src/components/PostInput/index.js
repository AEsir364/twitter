import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PostInput.module.css';
import { FiImage, FiSend, FiX } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CLOUDINARY_CLOUD_NAME = 'dp7u0cfl4';
const CLOUDINARY_UPLOAD_PRESET = 'twitter2';

function PostInput({ currentUserUid, currentUserProfileName, currentUserPhotoURL, onPostCreated }) {
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setPostImage(null);
      setImagePreviewUrl('');
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreviewUrl('');
    document.getElementById('postImageInput').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserUid) {
      console.warn("Usuário não logado. Não é possível postar.");
      alert("Você precisa estar logado para postar!");
      return;
    }
    if (postText.trim() === '' && !postImage) {
      return;
    }

    setIsPosting(true);
    let imageUrl = '';

    try {
      if (postImage) {
        const formData = new FormData();
        formData.append('file', postImage);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Cloudinary upload failed: ${response.status} - ${errorData.error.message || response.statusText}`);
        }
        const data = await response.json();
        imageUrl = data.secure_url;
        console.log("Imagem uploaded para Cloudinary (posts):", imageUrl);
      }

      await addDoc(collection(db, "posts"), {
        sender: currentUserProfileName,
        senderUid: currentUserUid,
        senderPhotoURL: currentUserPhotoURL && currentUserPhotoURL !== '' ? currentUserPhotoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo",
        text: postText.trim(),
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
        likes: {},
        reactions: {},
        comments: []
      });

      setPostText('');
      handleRemoveImage();
      console.log("Post criado com sucesso no Firestore!");
      if (onPostCreated) {
        onPostCreated();
      }

    } catch (error) {
      console.error("ERRO AO CRIAR POST OU FAZER UPLOAD DA IMAGEM:", error);
      alert(`Erro ao criar publicação: ${error.message}. Verifique o console para detalhes.`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className={styles.postInputContainer}>
      <form onSubmit={handleSubmit} className={styles.postInputForm}>
        <textarea
          className={styles.postTextarea}
          placeholder={currentUserUid ? "O que está acontecendo?" : "Faça login para postar..."}
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          rows="3"
          maxLength="280"
          disabled={!currentUserUid || isPosting}
        ></textarea>

        {imagePreviewUrl && (
          <div className={styles.imagePreview}>
            <img src={imagePreviewUrl} alt="Pré-visualização da imagem" className={styles.previewImage} />
            <button type="button" className={styles.removeImageButton} onClick={handleRemoveImage}>
              <FiX size={18} />
            </button>
          </div>
        )}

        <div className={styles.postActions}>
          <label htmlFor="postImageInput" className={styles.uploadButton} style={{ cursor: currentUserUid ? 'pointer' : 'not-allowed' }}>
            <FiImage size={18} />
            <span>Imagem</span>
            <input
              id="postImageInput"
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageChange}
              disabled={!currentUserUid || isPosting}
            />
          </label>
          <button type="submit" className={styles.sendPostButton} disabled={isPosting || (!postText.trim() && !postImage)}>
            <FiSend size={18} />
            <span>Postar</span>
          </button>
        </div>
      </form>
    </div>
  );
}

PostInput.propTypes = {
  currentUserUid: PropTypes.string,
  currentUserProfileName: PropTypes.string,
  currentUserPhotoURL: PropTypes.string,
  onPostCreated: PropTypes.func,
};

export default PostInput;