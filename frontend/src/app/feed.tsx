import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { Heart, MessageCircle, Pin, PinOff, Trash2, Newspaper, Send } from 'lucide-react-native';
import { Fonts } from '../../theme/typography';
import { Text, Avatar, Screen, Header, Loading, ErrorState, Empty, Button, Badge, cardStyle } from '../components/ui';
import { useAuthStore, isManagement, isStaff } from '../../store/authStore';
import { api } from '../services/api';
import { notify, confirmAction, apiError } from '../utils/notify';
import { timeAgo, roleLabel } from '../utils/format';

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; name: string; role: string; beltColor?: string | null };
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

export default function Feed() {
  const { user } = useAuthStore();
  const canPost = isStaff(user?.role);
  const manager = isManagement(user?.role);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchPosts = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/posts');
      setPosts(res.data || []);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar o feed.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const publish = async () => {
    if (!draft.trim()) {
      notify.error('Escreva algo antes de publicar.');
      return;
    }
    setPublishing(true);
    try {
      await api.post('/posts', { content: draft.trim() });
      setDraft('');
      notify.success('Publicado.');
      fetchPosts();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível publicar.'));
    } finally {
      setPublishing(false);
    }
  };

  const patchPost = (id: string, patch: Partial<Post>) =>
    setPosts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const toggleLike = async (post: Post) => {
    // otimista, desfaz se falhar
    patchPost(post.id, { likedByMe: !post.likedByMe, likesCount: post.likesCount + (post.likedByMe ? -1 : 1) });
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      patchPost(post.id, { likedByMe: res.data.liked, likesCount: res.data.likesCount });
    } catch (err) {
      patchPost(post.id, { likedByMe: post.likedByMe, likesCount: post.likesCount });
      notify.error(apiError(err, 'Não foi possível curtir.'));
    }
  };

  const togglePin = async (post: Post) => {
    try {
      await api.patch(`/posts/${post.id}/pin`, { isPinned: !post.isPinned });
      fetchPosts();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível alterar a fixação.'));
    }
  };

  const remove = async (post: Post) => {
    const ok = await confirmAction({
      title: 'Excluir publicação',
      message: 'Essa ação não pode ser desfeita.',
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/posts/${post.id}`);
      setPosts((list) => list.filter((p) => p.id !== post.id));
      notify.success('Publicação excluída.');
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível excluir.'));
    }
  };

  return (
    <Screen>
      <Header title="Comunidade" />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPosts(); }}
              tintColor={Colors.gold}
            />
          }
        >
          {canPost && (
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder="Compartilhe um aviso ou novidade com a academia"
                placeholderTextColor={Colors.muted}
                accessibilityLabel="Nova publicação"
                multiline
                value={draft}
                onChangeText={setDraft}
              />
              <Button label="Publicar" icon={Send} onPress={publish} loading={publishing} style={{ alignSelf: 'flex-end', marginTop: 12 }} />
            </View>
          )}

          {error ? (
            <ErrorState message={error} onRetry={fetchPosts} />
          ) : posts.length === 0 ? (
            <Empty
              icon={Newspaper}
              title="Nenhuma publicação ainda"
              hint={canPost ? 'Use o campo acima para publicar a primeira.' : 'Os avisos da academia aparecem aqui.'}
            />
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canPin={manager}
                canDelete={manager || post.author.id === user?.id}
                onLike={() => toggleLike(post)}
                onPin={() => togglePin(post)}
                onDelete={() => remove(post)}
                onCommentCount={(n) => patchPost(post.id, { commentsCount: n })}
              />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function PostCard({ post, canPin, canDelete, onLike, onPin, onDelete, onCommentCount }: {
  post: Post;
  canPin: boolean;
  canDelete: boolean;
  onLike: () => void;
  onPin: () => void;
  onDelete: () => void;
  onCommentCount: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingC, setLoadingC] = useState(false);
  const [errorC, setErrorC] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    setLoadingC(true);
    setErrorC('');
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data || []);
    } catch (err) {
      setErrorC(apiError(err, 'Não foi possível carregar os comentários.'));
    } finally {
      setLoadingC(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadComments();
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: text.trim() });
      setComments((c) => [...c, res.data]);
      onCommentCount(post.commentsCount + 1);
      setText('');
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível comentar.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[cardStyle, post.isPinned && { borderColor: Colors.gold }]}>
      <View style={styles.postHead}>
        <Avatar initials={post.author.name.substring(0, 2).toUpperCase()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{post.author.name}</Text>
          <Text style={styles.time}>
            {roleLabel(post.author.role)} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        {post.isPinned && <Badge label="Fixado" color={Colors.gold} icon={Pin} />}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onLike}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={post.likedByMe ? 'Remover curtida' : 'Curtir'}
        >
          <Heart size={20} color={post.likedByMe ? Colors.red : Colors.muted} fill={post.likedByMe ? Colors.red : 'transparent'} strokeWidth={2} />
          <Text style={[styles.actionText, post.likedByMe && { color: Colors.red }]}>{post.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={styles.action} accessibilityRole="button" accessibilityLabel="Comentários">
          <MessageCircle size={20} color={open ? Colors.gold : Colors.muted} strokeWidth={2} />
          <Text style={[styles.actionText, open && { color: Colors.gold }]}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {canPin && (
          <TouchableOpacity onPress={onPin} style={styles.action} accessibilityRole="button" accessibilityLabel={post.isPinned ? 'Desafixar publicação' : 'Fixar publicação'}>
            {post.isPinned ? <PinOff size={20} color={Colors.gold} strokeWidth={2} /> : <Pin size={20} color={Colors.muted} strokeWidth={2} />}
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.action} accessibilityRole="button" accessibilityLabel="Excluir publicação">
            <Trash2 size={20} color={Colors.red} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {open && (
        <View style={styles.commentsBox}>
          {loadingC ? (
            <Text style={styles.muted}>Carregando comentários...</Text>
          ) : errorC ? (
            <View>
              <Text style={[styles.muted, { color: Colors.red }]}>{errorC}</Text>
              <Button label="Tentar de novo" variant="ghost" onPress={loadComments} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
            </View>
          ) : comments.length === 0 ? (
            <Text style={styles.muted}>Seja o primeiro a comentar.</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>
                  {c.author.name} <Text style={styles.time}>{timeAgo(c.createdAt)}</Text>
                </Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, minHeight: 44 }]}
              placeholder="Escreva um comentário"
              placeholderTextColor={Colors.muted}
              accessibilityLabel="Escrever comentário"
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Button label="Enviar" onPress={send} loading={sending} disabled={!text.trim()} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: { ...cardStyle, borderColor: Colors.gold },
  input: {
    backgroundColor: Colors.card2, borderColor: Colors.border, borderWidth: 1, borderRadius: 12,
    padding: 12, color: Colors.text, fontSize: 16, fontFamily: Fonts.regular, minHeight: 60, textAlignVertical: 'top',
  },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.card2,
    borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.gold, fontWeight: 'bold', fontSize: 13 },
  author: { color: Colors.text, fontWeight: 'bold', fontSize: 15 },
  time: { color: Colors.muted, fontSize: 12, fontFamily: Fonts.mono },
  content: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6,
  },
  action: { paddingVertical: 8, paddingHorizontal: 8, minHeight: 44, minWidth: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 12 },
  commentsBox: { marginTop: 8, gap: 10 },
  muted: { color: Colors.muted, fontSize: 13 },
  comment: { backgroundColor: Colors.card2, borderRadius: 12, padding: 12 },
  commentAuthor: { color: Colors.text, fontWeight: 'bold', fontSize: 13 },
  commentText: { color: Colors.text, fontSize: 14, marginTop: 4, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
