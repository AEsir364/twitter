import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './PostCard.module.css';
import { FiHeart, FiMessageSquare, FiTrash2, FiRepeat, FiSend, FiX } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, updateDoc, deleteDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Botao from '../Botao';

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '...';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' +
         date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

function PostCard({ post }) {
  const [currentLoggedInUserUid, setCurrentLoggedInUserUid] = useState(null);
  const [currentLoggedInUserProfileName, setCurrentLoggedInUserProfileName] = useState('Convidado');
  const [currentLoggedInUserPhotoURL, setCurrentLoggedInUserPhotoURL] = useState('');
  const [displayedSenderName, setDisplayedSenderName] = useState(post.sender);
  const [displayedSenderPhotoURL, setDisplayedSenderPhotoURL] = useState(post.senderPhotoURL && post.senderPhotoURL !== '' ? post.senderPhotoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
  const [showRetweetModal, setShowRetweetModal] = useState(false);
  const [retweetCommentText, setRetweetCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showConfirmDeletePostModal, setShowConfirmDeletePostModal] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState(null);
  const [showConfirmDeleteCommentModal, setShowConfirmDeleteCommentModal] = useState(false);
  const [commentToDeleteInfo, setCommentToDeleteInfo] = useState({postId: null, commentIndex: null});

  // Monitors Firebase authentication state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentLoggedInUserUid(user.uid);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentLoggedInUserProfileName(userDocSnap.data().profileName);
            setCurrentLoggedInUserPhotoURL(userDocSnap.data().photoURL && userDocSnap.data().photoURL !== '' ? userDocSnap.data().photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
          } else {
            setCurrentLoggedInUserProfileName(user.uid);
            setCurrentLoggedInUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
          }
        } catch (error) {
          console.error("Erro ao buscar nome/foto de perfil do usuário logado:", error);
          setCurrentLoggedInUserProfileName(user.uid);
          setCurrentLoggedInUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
        }
      } else {
        setCurrentLoggedInUserUid(null);
        setCurrentLoggedInUserProfileName('Convidado');
        setCurrentLoggedInUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetches the sender's profile name and photo URL.
  useEffect(() => {
    const fetchSenderProfile = async (uidToFetch) => {
      if (uidToFetch) {
        try {
          const userDocRef = doc(db, "users", uidToFetch);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            return {
              name: userDocSnap.data().profileName,
              photo: userDocSnap.data().photoURL && userDocSnap.data().photoURL !== '' ? userDocSnap.data().photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo"
            };
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", uidToFetch, error);
        }
      }
      return { name: uidToFetch || 'Desconhecido', photo: "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo" };
    };

    if (post.type === 'retweet') {
      fetchSenderProfile(post.senderUid).then(profile => {
        setDisplayedSenderName(profile.name);
        setDisplayedSenderPhotoURL(profile.photo);
      });
    } else {
      fetchSenderProfile(post.senderUid).then(profile => {
        setDisplayedSenderName(profile.name);
        setDisplayedSenderPhotoURL(profile.photo);
      });
    }
  }, [post.senderUid, post.type]);

  const handleLike = async () => {
    if (!currentLoggedInUserUid) {
      console.warn('Usuário não logado para curtir.');
      alert("Você precisa estar logado para curtir!");
      return;
    }
    const postRef = doc(db, "posts", post.id);
    const newLikes = { ...post.likes };
    if (newLikes[currentLoggedInUserUid]) {
      delete newLikes[currentLoggedInUserUid];
    } else {
      newLikes[currentLoggedInUserUid] = true;
    }
    await updateDoc(postRef, { likes: newLikes });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentLoggedInUserUid) {
      console.warn('Usuário não logado para comentar.');
      alert("Você precisa estar logado para comentar!");
      return;
    }
    if (newCommentText.trim()) {
      const postRef = doc(db, "posts", post.id);
      const currentComments = post.comments || [];
      const newComment = {
        id: Date.now().toString(),
        sender: currentLoggedInUserProfileName,
        senderUid: currentLoggedInUserUid,
        senderPhotoURL: currentLoggedInUserPhotoURL,
        text: newCommentText.trim(),
        timestamp: new Date(),
        likes: {},
      };
      await updateDoc(postRef, {
        comments: [...currentComments, newComment]
      });
      setNewCommentText('');
      console.log("Comentário adicionado com sucesso!");
    }
  };

  const handleCommentLike = async (commentIndex) => {
    if (!currentLoggedInUserUid) {
      console.warn('Usuário não logado para curtir comentário.');
      alert("Você precisa estar logado para curtir comentários!");
      return;
    }
    const postRef = doc(db, "posts", post.id);
    const updatedComments = [...(post.comments || [])];
    const commentToUpdate = { ...updatedComments[commentIndex] };
    commentToUpdate.likes = commentToUpdate.likes || {};

    if (commentToUpdate.likes[currentLoggedInUserUid]) {
      delete commentToUpdate.likes[currentLoggedInUserUid];
    } else {
      commentToUpdate.likes[currentLoggedInUserUid] = true;
    }
    updatedComments[commentIndex] = commentToUpdate;
    await updateDoc(postRef, { comments: updatedComments });
  };

  const handleConfirmDeleteComment = (index) => {
    setCommentToDeleteInfo({postId: post.id, commentIndex: index});
    setShowConfirmDeleteCommentModal(true);
  };

  const handleDeleteComment = async () => {
    if (commentToDeleteInfo.postId && commentToDeleteInfo.commentIndex !== null) {
      try {
        const postRef = doc(db, "posts", commentToDeleteInfo.postId);
        const updatedComments = [...(post.comments || [])];
        if (updatedComments[commentToDeleteInfo.commentIndex].senderUid !== currentLoggedInUserUid) {
          console.warn("Tentativa de deletar comentário de outro usuário.");
          alert("Você só pode deletar seus próprios comentários.");
          setShowConfirmDeleteCommentModal(false);
          setCommentToDeleteInfo({postId: null, commentIndex: null});
          return;
        }
        updatedComments.splice(commentToDeleteInfo.commentIndex, 1);
        await updateDoc(postRef, { comments: updatedComments });
        console.log("Comentário deletado com sucesso!");
        setShowConfirmDeleteCommentModal(false);
        setCommentToDeleteInfo({postId: null, commentIndex: null});
      } catch (error) {
        console.error("Erro ao deletar comentário: ", error);
        alert(`Erro ao deletar comentário: ${error.message}.`);
      }
    }
  };

  const handleCancelDeleteComment = () => {
    setShowConfirmDeleteCommentModal(false);
    setCommentToDeleteInfo({postId: null, commentIndex: null});
  };

  const handleConfirmDeletePost = () => {
    setPostToDeleteId(post.id);
    setShowConfirmDeletePostModal(true);
  };

  const handleDeletePost = async () => {
    if (postToDeleteId) {
      try {
        if (post.senderUid !== currentLoggedInUserUid) {
          console.warn("Tentativa de deletar post de outro usuário.");
          alert("Você só pode deletar suas próprias publicações.");
          setShowConfirmDeletePostModal(false);
          setPostToDeleteId(null);
          return;
        }
        await deleteDoc(doc(db, "posts", postToDeleteId));
        console.log("Publicação deletada com sucesso!");
        setShowConfirmDeletePostModal(false);
        setPostToDeleteId(null);
      } catch (error) {
        console.error("Erro ao deletar publicação: ", error);
        alert(`Erro ao deletar publicação: ${error.message}.`);
      }
    }
  };

  const handleCancelDeletePost = () => {
    setShowConfirmDeletePostModal(false);
    setPostToDeleteId(null);
  };

  const handleRetweetClick = () => {
    if (!currentLoggedInUserUid) {
      console.warn('Usuário não logado para retuitar.');
      alert("Você precisa estar logado para retuitar!");
      return;
    }
    setShowRetweetModal(true);
  };

  const handleCreateRetweet = async () => {
    if (!currentLoggedInUserUid) return;

    try {
      await addDoc(collection(db, "posts"), {
        sender: currentLoggedInUserProfileName,
        senderUid: currentLoggedInUserUid,
        senderPhotoURL: currentLoggedInUserPhotoURL,
        timestamp: serverTimestamp(),
        type: 'retweet',
        retweetOf: post.id,
        originalSender: post.sender,
        originalSenderUid: post.senderUid,
        originalText: post.text,
        originalImageUrl: post.imageUrl || '',
        originalSenderPhotoURL: post.senderPhotoURL || "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo",
        retweetComment: retweetCommentText.trim() || '',
        likes: {},
        comments: []
      });
      console.log("Retweet criado com sucesso!");
      setShowRetweetModal(false);
      setRetweetCommentText('');
    } catch (error) {
      console.error("Erro ao retuitar:", error);
      alert(`Erro ao retuitar: ${error.message}.`);
    }
  };

  const totalLikes = Object.keys(post.likes || {}).length;
  const userHasLiked = post.likes && post.likes[currentLoggedInUserUid];
  
  return (
    <div className={styles.postCard}>
      {post.type === 'retweet' && (
        <div className={styles.retweetHeader}>
          <FiRepeat size={14} />
          <span className={styles.retweetedBy}>
            <Link to={`/profile/${post.senderUid}`} className={styles.retweeterLink}>
              {displayedSenderName}
            </Link> retuitou
          </span>
        </div>
      )}

      <div className={styles.postHeader}>
        <Link to={`/profile/${post.senderUid}`} className={styles.profileImageLink}>
          <img src={displayedSenderPhotoURL} alt="Foto de Perfil" className={styles.postSenderImage} />
        </Link>
        
        <div className={styles.postHeaderTextContent}>
          <Link to={`/profile/${post.senderUid}`} className={styles.postSenderLink}>
            <span className={styles.postSender}>
              {post.type === 'retweet' ? post.originalSender : displayedSenderName}
            </span>
          </Link>
          <span className={styles.postTimestamp}>
            {post.type === 'retweet' ? formatTimestamp(post.timestamp) : formatTimestamp(post.timestamp)}
          </span>
        </div>
        
        {post.type !== 'retweet' && post.senderUid === currentLoggedInUserUid && (
          <button className={styles.deletePostButton} onClick={handleConfirmDeletePost}>
            <FiTrash2 size={16} />
          </button>
        )}
        {post.type === 'retweet' && post.senderUid === currentLoggedInUserUid && (
          <button className={styles.deletePostButton} onClick={handleConfirmDeletePost}>
            <FiTrash2 size={16} />
          </button>
        )}
      </div>
      
      {post.type === 'retweet' && post.retweetComment && (
        <p className={styles.retweetCommentText}>{post.retweetComment}</p>
      )}

      {post.type !== 'retweet' && (
        <>
          <p className={styles.postText}>{post.text}</p>
          {post.imageUrl && (
            <div className={styles.postImageContainer}>
              <img src={post.imageUrl} alt="Publicação" className={styles.postImage} />
            </div>
          )}
        </>
      )}

      {post.type === 'retweet' && (
        <div className={styles.originalPostEmbedded}>
          <div className={styles.originalPostHeader}>
            <Link to={`/profile/${post.originalSenderUid}`} className={styles.profileImageLink}>
              <img src={post.originalSenderPhotoURL || "https://placehold.co/50x50/1DA1F2/ffffff?text=User"} alt="Foto de perfil original" className={styles.originalPostSenderImage} />
            </Link>
            <Link to={`/profile/${post.originalSenderUid}`} className={styles.originalPostSenderLink}>
              <span className={styles.originalPostSender}>@{post.originalSender}</span>
            </Link>
            <span className={styles.originalPostTimestamp}>{formatTimestamp(post.timestamp)}</span>
          </div>
          <p className={styles.originalPostText}>{post.originalText}</p>
          {(post.originalImageUrl || post.imageUrl) && (
            <div className={styles.originalPostImageContainer}>
              <img src={post.originalImageUrl || post.imageUrl} alt="Imagem original" className={styles.originalPostImage} />
            </div>
          )}
        </div>
      )}

      <div className={styles.postActions}>
        <button className={styles.actionButton} onClick={handleLike}>
          {userHasLiked ? <FaHeart size={18} color="red" /> : <FiHeart size={18} />}
          {totalLikes > 0 && <span className={styles.actionCount}>{totalLikes}</span>}
        </button>
        <button className={styles.actionButton} onClick={handleRetweetClick}>
          <FiRepeat size={18} />
        </button>
        <button className={styles.actionButton} onClick={() => setShowComments(!showComments)}>
          <FiMessageSquare size={18} />
          {(post.comments && post.comments.length > 0) && <span className={styles.actionCount}>{post.comments.length}</span>}
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {post.comments && post.comments.map((comment, index) => {
            const totalCommentLikes = Object.keys(comment.likes || {}).length;
            const userHasLikedComment = comment.likes && comment.likes[currentLoggedInUserUid];

            return (
              <div key={index} className={styles.commentItem}>
                <Link to={`/profile/${comment.senderUid}`} className={styles.profileImageLink}>
                  <img src={comment.senderPhotoURL || "https://placehold.co/50x50/1DA1F2/ffffff?text=User"} alt="Foto de perfil" className={styles.commentSenderImage} />
                </Link>
                <div className={styles.commentContentWrapper}>
                  <div className={styles.commentHeader}>
                    <Link to={`/profile/${comment.senderUid}`} className={styles.commentSenderLink}>
                      <span className={styles.commentSender}>{comment.sender}</span>
                    </Link>
                    <span className={styles.commentTimestamp}>{formatTimestamp(comment.timestamp)}</span>
                    {comment.senderUid === currentLoggedInUserUid && (
                      <button className={styles.deleteCommentButton} onClick={() => handleConfirmDeleteComment(index)}>
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                  <div className={styles.commentActions}>
                    <button className={styles.actionButton} onClick={() => handleCommentLike(index)}>
                      {userHasLikedComment ? <FaHeart size={16} color="red" /> : <FiHeart size={16} />}
                      {totalCommentLikes > 0 && <span className={styles.actionCount}>{totalCommentLikes}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <form onSubmit={handleAddComment} className={styles.commentInputForm}>
            <input
              type="text"
              placeholder="Responder..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className={styles.commentInput}
              maxLength="75"
            />
            <button type="submit" className={styles.sendCommentButton}>
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}

      {showConfirmDeletePostModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p className={styles.modalText}>Tem certeza que quer apagar esta publicação?</p>
            <div className={styles.modalButtons}>
              <Botao onClick={handleDeletePost}>Confirmar</Botao>
              <Botao onClick={handleCancelDeletePost} className={styles.cancelButton}>Cancelar</Botao>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteCommentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p className={styles.modalText}>Tem certeza que quer apagar este comentário?</p>
            <div className={styles.modalButtons}>
              <Botao onClick={handleDeleteComment}>Confirmar</Botao>
              <Botao onClick={handleCancelDeleteComment} className={styles.cancelButton}>Cancelar</Botao>
            </div>
          </div>
        </div>
      )}

      {showRetweetModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRetweetModal(false)}>
          <div className={styles.retweetModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowRetweetModal(false)}>
              <FiX size={20} />
            </button>
            <h3 className={styles.retweetModalTitle}>Retuitar com comentário</h3>
            <textarea
              className={styles.retweetTextarea}
              placeholder="Adicione um comentário ao seu Retweet..."
              value={retweetCommentText}
              onChange={(e) => setRetweetCommentText(e.target.value)}
              rows="3"
              maxLength="280"
            ></textarea>
            <div className={styles.originalPostPreview}>
              <div className={styles.originalPostHeader}>
                <Link to={`/profile/${post.originalSenderUid || post.senderUid}`} className={styles.profileImageLink}>
                  <img src={post.originalSenderPhotoURL || post.senderPhotoURL || "https://placehold.co/50x50/1DA1F2/ffffff?text=User"} alt="Foto de perfil original" className={styles.originalPostSenderImage} />
                </Link>
                <Link to={`/profile/${post.originalSenderUid || post.senderUid}`} className={styles.originalPostSenderLink}>
                  <span className={styles.originalPostSender}>@{post.originalSender || post.sender}</span>
                </Link>
                <span className={styles.originalPostTimestamp}>{formatTimestamp(post.timestamp)}</span>
              </div>
              <p className={styles.originalPostText}>{post.originalText || post.text}</p>
              {(post.originalImageUrl || post.imageUrl) && <img src={post.originalImageUrl || post.imageUrl} alt="Original Post" className={styles.originalPostImage} />}
            </div>
            <Botao onClick={handleCreateRetweet}>Retuitar</Botao>
          </div>
        </div>
      )}
    </div>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    senderUid: PropTypes.string.isRequired,
    senderPhotoURL: PropTypes.string,
    timestamp: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.object,
      PropTypes.string
    ]).isRequired,
    text: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    likes: PropTypes.object,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        sender: PropTypes.string.isRequired,
        senderUid: PropTypes.string.isRequired,
        senderPhotoURL: PropTypes.string,
        timestamp: PropTypes.oneOfType([
          PropTypes.instanceOf(Date),
          PropTypes.object,
          PropTypes.string
        ]).isRequired,
        text: PropTypes.string.isRequired,
        likes: PropTypes.objectOf(PropTypes.bool),
      })
    ),
    type: PropTypes.string,
    retweetOf: PropTypes.string,
    originalSender: PropTypes.string,
    originalSenderUid: PropTypes.string,
    originalText: PropTypes.string,
    originalImageUrl: PropTypes.string,
    originalSenderPhotoURL: PropTypes.string,
    retweetComment: PropTypes.string,
  }).isRequired,
};

export default PostCard;