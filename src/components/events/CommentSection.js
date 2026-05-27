/**
 * CommentSection.js
 * - Server-side check for can-comment (fixes attendees not being able to comment)
 * - WhatsApp-style bubbles, latest at bottom
 * - Delete own comment
 * - Organizer always can comment
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native'
import useThemeStore  from '../../store/themeStore'
import useAuthStore   from '../../store/authStore'
import Avatar         from '../common/Avatar'
import { commentsApi } from '../../services/api'

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}

export default function CommentSection({ eventId, isOrganizer }) {
  const { colors }  = useThemeStore()
  const { user }    = useAuthStore()
  const [comments, setComments]   = useState([])
  const [text, setText]           = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [canComment, setCanComment] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    loadComments()
    checkCanComment()
    const iv = setInterval(loadComments, 30000)
    return () => clearInterval(iv)
  }, [eventId])

  async function loadComments() {
    try {
      const data = await commentsApi.get(eventId)
      setComments(data.comments)
    } catch {}
    finally { setLoading(false) }
  }

  async function checkCanComment() {
    if (!user) { setCanComment(false); return }
    if (isOrganizer) { setCanComment(true); return }
    try {
      // Server-side truth — fixes attendees not being able to comment
      const res = await commentsApi.canComment(eventId)
      setCanComment(res.canComment)
    } catch {
      setCanComment(false)
    }
  }

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      const data = await commentsApi.post(eventId, text.trim())
      setComments(prev => [...prev, data.comment])
      setText('')
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (err) {
      Alert.alert('Could not post', err.message)
    } finally { setSending(false) }
  }

  async function handleDelete(commentId) {
    Alert.alert('Delete?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await commentsApi.delete(eventId, commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
          } catch (err) { Alert.alert('Error', err.message) }
        },
      },
    ])
  }

  useEffect(() => {
    if (comments.length > 0 && !loading)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50)
  }, [loading])

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : comments.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textHint }]}>
          {canComment ? 'No comments yet. Start the conversation!' : 'No comments yet.'}
        </Text>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {comments.map(c => {
            const isMe = user?.id === c.userId
            return (
              <View key={c.id} style={[
                styles.bubble,
                isMe
                  ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                  : [styles.bubbleOther, { backgroundColor: colors.surface }],
              ]}>
                {!isMe && (
                  <View style={styles.bubbleHeader}>
                    <Avatar uri={c.authorAvatar} name={c.authorName} size={18} />
                    <Text style={[styles.authorName, { color: colors.primary }]}>
                      {c.authorName || 'Anonymous'}
                    </Text>
                  </View>
                )}
                <Text style={[styles.bubbleText, { color: isMe ? '#fff' : colors.textPrimary }]}>
                  {c.text}
                </Text>
                <View style={styles.bubbleFooter}>
                  <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textHint }]}>
                    {timeAgo(c.createdAt)}
                  </Text>
                  {isMe && (
                    <TouchableOpacity onPress={() => handleDelete(c.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}
          <View style={{ height: 8 }} />
        </ScrollView>
      )}

      {canComment ? (
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {Platform.OS === 'web' ? (
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Write a comment..."
              maxLength={500}
              style={{
                flex: 1, border: 'none', outline: 'none',
                backgroundColor: 'transparent', color: colors.textPrimary,
                fontSize: 14, fontFamily: 'inherit', padding: '0 8px', minWidth: 0,
              }}
            />
          ) : (
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={text} onChangeText={setText}
              placeholder="Write a comment..."
              placeholderTextColor={colors.textHint}
              multiline maxLength={500}
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
            />
          )}
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: (!text.trim() || sending) ? 0.4 : 1 }]}
            onPress={handleSend} disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendBtnTxt}>↑</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.lockedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lockedTxt, { color: colors.textHint }]}>
            {!user ? 'Sign in and join to comment' : 'Join this event to comment'}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  empty:   { fontSize: 13, marginBottom: 10 },
  bubble:  { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  bubbleMe:    { alignSelf: 'flex-end', borderBottomRightRadius: 3 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 3 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  authorName:   { fontSize: 11, fontWeight: '700' },
  bubbleText:   { fontSize: 14, lineHeight: 19 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 3 },
  bubbleTime:   { fontSize: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 24,
    paddingLeft: 14, paddingRight: 6, paddingVertical: 6, gap: 8, marginTop: 10,
  },
  input:    { flex: 1, fontSize: 14, maxHeight: 80, paddingVertical: 4 },
  sendBtn:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sendBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  lockedRow:  { borderWidth: 1.5, borderRadius: 12, padding: 12, marginTop: 8, alignItems: 'center' },
  lockedTxt:  { fontSize: 13 },
})
