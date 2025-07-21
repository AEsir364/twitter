import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import PostCard from '../../components/PostCard';
import Botao from '../../components/Botao';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, query, collection, where, orderBy, onSnapshot, deleteField } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CLOUDINARY_CLOUD_NAME = 'dp7u0cfl4';
const CLOUDINARY_PROFILE_UPLOAD_PRESET = 'twitter2 profile';

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [userTweetsAndRetweets, setUserTweetsAndRetweets] = useState([]);
  const [userReplies, setUserReplies] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTweetsAndRetweets, setLoadingTweetsAndRetweets] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImageFile, setEditProfileImageFile] = useState(null);
  const [editProfileImageUrlPreview, setEditProfileImageUrlPreview] = useState('');
  const [editBannerImageFile, setEditBannerImageFile] = useState(null);
  const [editBannerImageUrlPreview, setEditBannerImageUrlPreview] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [selectedTab, setSelectedTab] = useState('tweetsAndRetweets');

  // Monitors authentication state and sets if the logged-in user is the profile owner.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setIsOwner(user.uid === userId);
      } else {
        setCurrentUserUid(null);
        setIsOwner(false);
      }
    });
    return () => unsubscribeAuth();
  }, [userId]);

  // Fetches profile data and follow/following information.
  useEffect(() => {
    setLoadingProfile(true);
    const userDocRef = doc(db, "users", userId);
    const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setEditProfileName(data.profileName || '');
        setEditBio(data.bio || '');
        setEditProfileImageUrlPreview(data.photoURL && data.photoURL !== '' ? data.photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
        setEditBannerImageUrlPreview(data.bannerURL && data.bannerURL !== '' ? data.bannerURL : "");

        if (currentUserUid && currentUserUid !== userId) {
          setIsFollowing(!!(data.followers && data.followers[currentUserUid]));
        } else {
          setIsFollowing(false);
        }

        setFollowersCount(Object.keys(data.followers || {}).length);
        setFollowingCount(Object.keys(data.following || {}).length);

      } else {
        console.warn("Nenhum perfil encontrado para o usuário:", userId);
        setProfileData(null);
        navigate('/feed');
      }
      setLoadingProfile(false);
    }, (error) => {
      console.error("Erro ao carregar perfil:", error);
      setLoadingProfile(false);
      navigate('/feed');
    });

    return () => unsubscribeProfile();
  }, [userId, navigate, currentUserUid]);

  // Fetches user's tweets and retweets.
  useEffect(() => {
    setLoadingTweetsAndRetweets(true);
    const tweetsAndRetweetsQuery = query(
      collection(db, "posts"),
      where("senderUid", "==", userId),
      orderBy("timestamp", "desc")
    );

    const unsubscribeTweetsAndRetweets = onSnapshot(tweetsAndRetweetsQuery, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserTweetsAndRetweets(fetchedItems);
      setLoadingTweetsAndRetweets(false);
    }, (error) => {
      console.error("Erro ao carregar Tweets e Retweets do usuário:", error);
      setLoadingTweetsAndRetweets(false);
    });

    return () => unsubscribeTweetsAndRetweets();
  }, [userId]);

  // Fetches user's replies.
  useEffect(() => {
    setLoadingReplies(true);
    const allPostsQuery = query(collection(db, "posts"));
    const unsubscribeReplies = onSnapshot(allPostsQuery, (snapshot) => {
      const fetchedReplies = [];
      snapshot.forEach(postDoc => {
        const postData = postDoc.data();
        if (postData.comments && postData.comments.length > 0) {
          postData.comments.forEach(comment => {
            if (comment.senderUid === userId) {
              fetchedReplies.push({
                id: postDoc.id,
                ...postData,
                comment: comment,
                isReplyCard: true,
              });
            }
          });
        }
      });
      fetchedReplies.sort((a, b) => (b.comment.timestamp?.toDate ? b.comment.timestamp.toDate() : new Date(b.comment.timestamp)) - (a.comment.timestamp?.toDate ? a.comment.timestamp.toDate() : new Date(a.comment.timestamp)));
      
      setUserReplies(fetchedReplies);
      setLoadingReplies(false);
    }, (error) => {
      console.error("Erro ao carregar respostas do usuário:", error);
      setLoadingReplies(false);
    });

    return () => unsubscribeReplies();
  }, [userId]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditProfileName(profileData.profileName || '');
    setEditBio(profileData.bio || '');
    setEditProfileImageFile(null);
    setEditProfileImageUrlPreview(profileData.photoURL && profileData.photoURL !== '' ? profileData.photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
    setEditBannerImageFile(null);
    setEditBannerImageUrlPreview(profileData.bannerURL && profileData.bannerURL !== '' ? profileData.bannerURL : "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfileName(profileData.profileName || '');
    setEditBio(profileData.bio || '');
    setEditProfileImageFile(null);
    setEditProfileImageUrlPreview(profileData.photoURL && profileData.photoURL !== '' ? profileData.photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
    setEditBannerImageFile(null);
    setEditBannerImageUrlPreview(profileData.bannerURL && profileData.bannerURL !== '' ? profileData.bannerURL : "");
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditProfileImageFile(file);
      setEditProfileImageUrlPreview(URL.createObjectURL(file));
    } else {
      setEditProfileImageFile(null);
      setEditProfileImageUrlPreview(profileData.photoURL && profileData.photoURL !== '' ? profileData.photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
    }
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditBannerImageFile(file);
      setEditBannerImageUrlPreview(URL.createObjectURL(file));
    } else {
      setEditBannerImageFile(null);
      setEditBannerImageUrlPreview(profileData.bannerURL && profileData.bannerURL !== '' ? profileData.bannerURL : "");
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData || !isOwner || isSavingProfile) return;

    setIsSavingProfile(true);
    let newPhotoURL = profileData.photoURL || '';
    let newBannerURL = profileData.bannerURL || '';

    try {
      if (editProfileImageFile) {
        const formData = new FormData();
        formData.append('file', editProfileImageFile);
        formData.append('upload_preset', CLOUDINARY_PROFILE_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Cloudinary upload failed (profile pic): ${response.status} - ${errorData.error.message || response.statusText}`);
        }
        const data = await response.json();
        newPhotoURL = data.secure_url;
      }

      if (editBannerImageFile) {
        const formData = new FormData();
        formData.append('file', editBannerImageFile);
        formData.append('upload_preset', CLOUDINARY_PROFILE_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Cloudinary upload failed (banner): ${response.status} - ${errorData.error.message || response.statusText}`);
        }
        const data = await response.json();
        newBannerURL = data.secure_url;
      }

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        profileName: editProfileName,
        bio: editBio,
        photoURL: newPhotoURL,
        bannerURL: newBannerURL,
      });

      setIsEditing(false);
      setEditProfileImageFile(null);
      setEditBannerImageFile(null);
    } catch (error) {
      console.error("ERRO AO SALVAR PERFIL:", error);
      alert(`Erro ao salvar perfil: ${error.message}. Verifique o console para detalhes.`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserUid || isOwner) {
      alert("Você precisa estar logado e não pode seguir a si mesmo.");
      return;
    }

    try {
      const currentUserRef = doc(db, "users", currentUserUid);
      const targetUserRef = doc(db, "users", userId);

      if (isFollowing) {
        await updateDoc(currentUserRef, {
          [`following.${userId}`]: deleteField()
        });
        await updateDoc(targetUserRef, {
          [`followers.${currentUserUid}`]: deleteField()
        });
      } else {
        await updateDoc(currentUserRef, {
          [`following.${userId}`]: true
        });
        await updateDoc(targetUserRef, {
          [`followers.${currentUserUid}`]: true
        });
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      alert(`Erro ao seguir/deixar de seguir: ${error.message}.`);
    }
  };

  const handleOpenFollowersModal = async () => {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.followers) {
        const fetchedFollowers = await Promise.all(
          Object.keys(data.followers).map(async (uid) => {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? { uid: uid, profileName: userSnap.data().profileName, photoURL: userSnap.data().photoURL && userSnap.data().photoURL !== '' ? userSnap.data().photoURL : "https://placehold.co/50x50/1DA1F2/ffffff?text=User" } : { uid: uid, profileName: "Usuário Desconhecido", photoURL: "https://placehold.co/50x50/1DA1F2/ffffff?text=User" };
          })
        );
        setFollowersList(fetchedFollowers);
      } else {
        setFollowersList([]);
      }
    }
    setShowFollowersModal(true);
  };

  const handleOpenFollowingModal = async () => {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.following) {
        const fetchedFollowing = await Promise.all(
          Object.keys(data.following).map(async (uid) => {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? { uid: uid, profileName: userSnap.data().profileName, photoURL: userSnap.data().photoURL && userSnap.data().photoURL !== '' ? userSnap.data().photoURL : "https://placehold.co/50x50/1DA1F2/ffffff?text=User" } : { uid: uid, profileName: "Usuário Desconhecido", photoURL: "https://placehold.co/50x50/1DA1F2/ffffff?text=User" };
          })
        );
        setFollowingList(fetchedFollowing);
      } else {
        setFollowingList([]);
      }
    }
    setShowFollowingModal(true);
  };

  if (loadingProfile) {
    return <div className={styles.profilePageWrapper}><p className={styles.loadingMessage}>Carregando perfil...</p></div>;
  }

  if (!profileData) {
    return <div className={styles.profilePageWrapper}><p className={styles.noProfileMessage}>Perfil não encontrado.</p></div>;
  }

  return (
    <div className={styles.profilePageWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.profileBanner} style={{ backgroundImage: `url(${editBannerImageUrlPreview})` }}>
          {isEditing && (
            <label htmlFor="bannerImageInput" className={styles.changeBannerButton}>
              <input
                id="bannerImageInput"
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className={styles.fileInput}
              />
              Alterar Banner
            </label>
          )}
        </div>

        <div className={styles.profileHeaderContent}>
          <div className={styles.profileImageContainer}>
            <img 
              src={editProfileImageUrlPreview}
              alt="Foto de Perfil" 
              className={styles.profileImage} 
            />
            {isEditing && (
              <label htmlFor="profileImageInput" className={styles.changeProfileImageButton}>
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className={styles.fileInput}
                />
                Alterar Foto
              </label>
            )}
          </div>
          
          <div className={styles.profileActions}>
            {isOwner && !isEditing && (
              <Botao onClick={handleEditClick} className={styles.editProfileButton}>
                Editar perfil
              </Botao>
            )}
            {!isOwner && currentUserUid && (
              <Botao onClick={handleFollowToggle} className={isFollowing ? styles.unfollowButton : styles.followButton}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Botao>
            )}
          </div>
        </div>

        <div className={styles.profileInfo}>
          {isEditing ? (
            <input
              type="text"
              value={editProfileName}
              onChange={(e) => setEditProfileName(e.target.value)}
              className={styles.editProfileNameInput}
              maxLength="50"
            />
          ) : (
            <h1 className={styles.profileName}>{profileData.profileName}</h1>
          )}
          <p className={styles.username}>@{profileData.username}</p>
        </div>
        
        {isEditing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            className={styles.editBioTextarea}
            placeholder="Adicione sua biografia..."
            rows="4"
            maxLength="160"
          ></textarea>
        ) : (
          <p className={styles.profileBio}>{profileData.bio || 'Nenhuma biografia ainda.'}</p>
        )}

        <div className={styles.followStats}>
          <button className={styles.followStatButton} onClick={handleOpenFollowingModal}>
            <span className={styles.followCount}>{followingCount}</span>
            <span className={styles.followLabel}>Seguindo</span>
          </button>
          <button className={styles.followStatButton} onClick={handleOpenFollowersModal}>
            <span className={styles.followCount}>{followersCount}</span>
            <span className={styles.followLabel}>Seguidores</span>
          </button>
        </div>

        {isEditing && (
          <div className={styles.editActions}>
            <Botao onClick={() => handleSaveProfile()} disabled={isSavingProfile}>Salvar</Botao>
            <Botao onClick={() => handleCancelEdit()} className={styles.cancelButton}>Cancelar</Botao>
          </div>
        )}

        <div className={styles.profileTabs}>
          <button
            className={`${styles.tabButton} ${selectedTab === 'tweetsAndRetweets' ? styles.activeTab : ''}`}
            onClick={() => setSelectedTab('tweetsAndRetweets')}
          >
            Tweets & Retweets
          </button>
          <button
            className={`${styles.tabButton} ${selectedTab === 'replies' ? styles.activeTab : ''}`}
            onClick={() => setSelectedTab('replies')}
          >
            Respostas
          </button>
        </div>

        {selectedTab === 'tweetsAndRetweets' && (
          <div className={styles.postsSection}>
            {loadingTweetsAndRetweets ? (
              <p className={styles.loadingMessage}>Carregando publicações...</p>
            ) : (
              userTweetsAndRetweets.length === 0 ? (
                <p className={styles.noPostsMessage}>Nenhuma publicação ainda.</p>
              ) : (
                <div className={styles.postsList}>
                  {userTweetsAndRetweets.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {selectedTab === 'replies' && (
          <div className={styles.postsSection}>
            {loadingReplies ? (
              <p className={styles.loadingMessage}>Carregando respostas...</p>
            ) : (
              userReplies.length === 0 ? (
                <p className={styles.noPostsMessage}>Nenhuma resposta ainda.</p>
              ) : (
                <div className={styles.postsList}>
                  {userReplies.map((replyPost) => (
                    <PostCard key={replyPost.id + replyPost.comment.id} post={replyPost} isReplyCard={true} />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {showFollowersModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFollowersModal(false)}>
          <div className={styles.followListModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.followListModalTitle}>Seguidores</h3>
            {followersList.length === 0 ? (
              <p className={styles.modalText}>Nenhum seguidor ainda.</p>
            ) : (
              <ul className={styles.followList}>
                {followersList.map(user => (
                  <li key={user.uid} className={styles.followListItem}>
                    <img src={user.photoURL} alt="Foto de perfil" className={styles.followListImage} />
                    <span className={styles.followListName}>{user.profileName}</span>
                    <button className={styles.followListButton} onClick={() => {navigate(`/profile/${user.uid}`); setShowFollowersModal(false);}}>Ver Perfil</button>
                  </li>
                ))}
              </ul>
            )}
            <button className={styles.closeModalButton} onClick={() => setShowFollowersModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {showFollowingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFollowingModal(false)}>
          <div className={styles.followListModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.followListModalTitle}>Seguindo</h3>
            {followingList.length === 0 ? (
              <p className={styles.modalText}>Não está seguindo ninguém ainda.</p>
            ) : (
              <ul className={styles.followList}>
                {followingList.map(user => (
                  <li key={user.uid} className={styles.followListItem}>
                    <img src={user.photoURL} alt="Foto de perfil" className={styles.followListImage} />
                    <span className={styles.followListName}>{user.profileName}</span>
                    <button className={styles.followListButton} onClick={() => {navigate(`/profile/${user.uid}`); setShowFollowingModal(false);}}>Ver Perfil</button>
                  </li>
                ))}
              </ul>
            )}
            <button className={styles.closeModalButton} onClick={() => setShowFollowingModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

ProfilePage.propTypes = {
  // userId é passado via useParams, não como prop direta
};

export default ProfilePage;