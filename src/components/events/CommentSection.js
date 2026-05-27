/**
 * CommentSection.js
 * Only people who have joined the event can post comments.
 * Anyone can read them.
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar         from '../common/Avatar'
import { commentsApi } from '../../services/api'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function CommentSection({ eventId, onRequireAuth }) {
  const { colors }      = useThemeStore()
  const { user }        = useAuthStore()
  const { isAttending } = useEventsStore()

  const [comments, setComments]   = useState([])
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const scrollRef                 = useRef(null)

  // Only attendees can post
  const hasJoined  = isAttending(eventId)
  const canComment = user && hasJoined

  useEffect(() => {
    loadComments()
    const interval = setInterval(loadComments, 30000)
    return () => clearInterval(interval)
  }, [eventId])

  async function loadComments() {
    try {
      const data = await commentsApi.get(eventId)
      setComments(data.comments)
    } catch {}
    finally { setLoading(false) }
  }

  async function handleSend() {
    if (!user) { onRequireAuth?.(); return }
    if (!hasJoined) {
      Alert.alert('Join first', 'You need to join this event to comment.')
      return
    }
    if (!text.trim()) return

    setSending(true)
    try {
      const data = await commentsApi.post(eventId, text.trim())
      setComments(prev => [...prev, data.comment])
      setText('')
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (err) {
      Alert.alert('Could not post', err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId) {
    Alert.alert('Delete comment?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await commentsApi.delete(eventId, commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
          } catch (err) {
            Alert.alert('Error', err.message)
          }
        },
      },
    ])
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Comments {comments.length > 0 ? `(${comments.length})` : ''}
        </Text>
        {!canComment && user && !hasJoined && (
          <Text style={[styles.joinNote, { color: colors.textHint }]}>
            Join event to comment
          </Text>
        )}
      </View>

      {/* Comment list */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textHint }]}>
          No comments yet.{canComment ? ' Ask a question!' : ''}
        </Text>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: 280 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {comments.map(c => (
            <View key={c.id} style={[styles.comment, { backgroundColor: colors.surface }]}>
              <Avatar uri={c.authorAvatar} name={c.authorName} size={30} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>
                    {c.authorName || 'Anonymous'}
                  </Text>
                  <Text style={[styles.commentTime, { color: colors.textHint }]}>
                    {timeAgo(c.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                  {c.text}
                </Text>
              </View>
              {user?.id === c.userId && (
                <TouchableOpacity
                  onPress={() => handleDelete(c.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: colors.textHint, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input — only shown if user has joined */}
      {canComment ? (
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={text}
            onChangeText={setText}
            placeholder="Ask a question..."
            placeholderTextColor={colors.textHint}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary, opacity: (!text.trim() || sending) ? 0.4 : 1 }
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendBtnTxt}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        // Show why they can't comment
        <View style={[styles.lockedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lockedTxt, { color: colors.textHint }]}>
            {!user
              ? 'Sign in and join this event to comment'
              : 'Join this event to comment'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper:  { marginTop: 8, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:    { fontSize: 16, fontWeight: '800' },
  joinNote: { fontSize: 12 },
  empty:    { fontSize: 14, marginBottom: 12 },
  comment: {
    flexDirection: 'row', borderRadius: 10,
    padding: 10, marginBottom: 8, gap: 8, alignItems: 'flex-start',
  },
  commentBody:   { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  authorName:    { fontSize: 13, fontWeight: '700' },
  commentTime:   { fontSize: 11 },
  commentText:   { fontSize: 13, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderWidth: 1.5, borderRadius: 12,
    paddingLeft: 12, paddingRight: 6, paddingVertical: 6,
    gap: 8, marginTop: 8,
  },
  input:    { flex: 1, fontSize: 14, maxHeight: 80, paddingVertical: 4 },
  sendBtn:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sendBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  lockedRow: {
    borderWidth: 1.5, borderRadius: 12,
    padding: 14, marginTop: 8, alignItems: 'center',
  },
  lockedTxt: { fontSize: 13 },
})
