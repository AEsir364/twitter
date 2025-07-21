import React, { useState, useEffect } from 'react';
import styles from './FeedPage.module.css';
import PostCard from '../../components/PostCard';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Fetches posts from Firestore and updates state.
  useEffect(() => {
    setLoadingPosts(true);
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribePosts = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ ...doc.data(), id: doc.id });
      });
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Erro ao ler posts: ", error);
      setLoadingPosts(false);
    });

    return () => {
      unsubscribePosts();
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      {loadingPosts ? (
        <p className={styles.loadingMessage}>Carregando publicações...</p>
      ) : (
        posts.length === 0 ? (
          <p className={styles.noPostsMessage}>Nenhuma publicação ainda. Seja o primeiro a postar!</p>
        ) : (
          <div className={styles.postsList}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default FeedPage;