/**
 * CommentSection.js
 *
 * Smooth, fast comment experience:
 * 1. Loads cached comments from AsyncStorage instantly (<50ms)
 * 2. Fetches fresh from server in background (~3-8s on 2G)
 * 3. Auto-refreshes every 8 seconds while screen is open
 * 4. canComment is set optimistically after joining — no extra round trip
 * 5. New comment appears instantly (optimistic) before server confirms
 * 6. WhatsApp-style bubbles, scrolls to bottom on open
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import AsyncStorage  from '@react-native-async-storage/async-storage'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import useEventsStore from '../../store/eventsStore'
import Avatar        from '../common/Avatar'
import { commentsApi } from '../../services/api'

const REFRESH_MS = 8000  // refresh every 8 seconds

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}

function cacheKey(id) { return `rede:comments:${id}` }

export default function CommentSection({ eventId, isOrganizer, justJoined }) {
  const { colors }      = useThemeStore()
  const { user }        = useAuthStore()
  const { isAttending } = useEventsStore()

  const [comments,    setComments]    = useState([])
  const [text,        setText]        = useState('')
  const [initialLoad, setInitialLoad] = useState(true)
  const [sending,     setSending]     = useState(false)

  // canComment:
  // - true immediately if user is organiser
  // - true immediately if user is already in attending list (persistent store)
  // - true immediately if justJoined prop is set (optimistic after join)
  // - else: check server
  const alreadyAttending = isAttending(eventId)
  const [canComment, setCanComment] = useState(
    isOrganizer || alreadyAttending || justJoined || false
  )

  const scrollRef  = useRef(null)
  const intervalRef = useRef(null)
  const mounted    = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Update canComment if justJoined or attending changes
  useEffect(() => {
    if (isOrganizer || alreadyAttending || justJoined) {
      setCanComment(true)
    }
  }, [isOrganizer, alreadyAttending, justJoined])

  const fetchFresh = useCallback(async () => {
    try {
      const data = await commentsApi.get(eventId)
      if (!mounted.current) return
      const fresh = data.comments || []
      setComments(fresh)
      // Save to cache
      AsyncStorage.setItem(cacheKey(eventId), JSON.stringify(fresh)).catch(() => {})
    } catch {}
  }, [eventId])

  useEffect(() => {
    let didMount = true

    async function init() {
      // Step 1: load cache instantly
      try {
        const cached = await AsyncStorage.getItem(cacheKey(eventId))
        if (cached && didMount) {
          setComments(JSON.parse(cached))
          setInitialLoad(false)
        }
      } catch {}

      // Step 2: fetch fresh from server
      await fetchFresh()
      if (didMount) setInitialLoad(false)

      // Step 3: if we don't know canComment yet, check server
      if (!isOrganizer && !alreadyAttending && !justJoined && user) {
        try {
          const res = await commentsApi.canComment(eventId)
          if (didMount) setCanComment(res.canComment)
        } catch {}
      }

      // Step 4: auto-refresh every 8 seconds
      intervalRef.current = setInterval(() => {
        if (mounted.current) fetchFresh()
      }, REFRESH_MS)
    }

    init()

    return () => {
      didMount = false
      clearInterval(intervalRef.current)
    }
  }, [eventId])

  // Scroll to bottom when comments first load
  useEffect(() => {
    if (!initialLoad && comments.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80)
    }
  }, [initialLoad])

  async function handleSend() {
    if (!text.trim()) return
    const body = text.trim()
    setText('')

    // Optimistic: show immediately with a temp id
    const tempComment = {
      id:           `temp-${Date.now()}`,
      text:         body,
      userId:       user?.id,
      authorName:   user?.name || user?.nickname || 'You',
      authorAvatar: user?.avatar,
      createdAt:    new Date().toISOString(),
      isTemp:       true,
    }
    setComments(prev => [...prev, tempComment])
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)

    setSending(true)
    try {
      const data = await commentsApi.post(eventId, body)
      // Replace temp with real
      setComments(prev =>
        prev.map(c => c.id === tempComment.id ? data.comment : c)
      )
    } catch (err) {
      // Remove temp on failure
      setComments(prev => prev.filter(c => c.id !== tempComment.id))
      setText(body)  // restore text
      Alert.alert('Could not post', err.message)
    } finally { setSending(false) }
  }

  async function handleDelete(commentId) {
    Alert.alert('Delete comment?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setComments(prev => prev.filter(c => c.id !== commentId))
          try { await commentsApi.delete(eventId, commentId) }
          catch (err) { Alert.alert('Error', err.message); fetchFresh() }
        },
      },
    ])
  }

  return (
    <View style={st.wrapper}>

      {/* Comments list */}
      {initialLoad && comments.length === 0 ? (
        <View style={st.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[st.loadingTxt, { color: colors.textHint }]}>Loading comments…</Text>
        </View>
      ) : comments.length === 0 ? (
        <Text style={[st.empty, { color: colors.textHint }]}>
          {canComment ? 'No comments yet. Start the conversation!' : 'No comments yet.'}
        </Text>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: 340 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {comments.map(c => {
            const isMe = user?.id === c.userId
            return (
              <View
                key={c.id}
                style={[
                  st.bubble,
                  isMe ? [st.bubbleMe,    { backgroundColor: colors.primary }]
                       : [st.bubbleOther, { backgroundColor: colors.surface }],
                  c.isTemp && { opacity: 0.7 },
                ]}
              >
                {!isMe && (
                  <View style={st.bubbleHead}>
                    <Avatar uri={c.authorAvatar} name={c.authorName} size={18} />
                    <Text style={[st.author, { color: colors.primary }]}>
                      {c.authorName || 'Anonymous'}
                    </Text>
                  </View>
                )}
                <Text style={[st.bubbleTxt, { color: isMe ? '#fff' : colors.textPrimary }]}>
                  {c.text}
                </Text>
                <View style={st.bubbleFoot}>
                  <Text style={[st.time, { color: isMe ? 'rgba(255,255,255,0.55)' : colors.textHint }]}>
                    {c.isTemp ? 'Sending…' : timeAgo(c.createdAt)}
                  </Text>
                  {isMe && !c.isTemp && (
                    <TouchableOpacity
                      onPress={() => handleDelete(c.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}
          <View style={{ height: 10 }} />
        </ScrollView>
      )}

      {/* Input row */}
      {canComment ? (
        <View style={[st.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Avatar uri={user?.avatar} name={user?.name} size={28} />
            <TextInput
              style={[st.input, { color: colors.textPrimary }]}
              value={text} onChangeText={setText}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textHint}
              multiline maxLength={500}
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          <TouchableOpacity
            style={[st.sendBtn, {
              backgroundColor: colors.primary,
              opacity: (!text.trim() || sending) ? 0.35 : 1,
            }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={st.sendTxt}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[st.locked, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[st.lockedTxt, { color: colors.textHint }]}>
            {!user ? '🔒 Sign in and join to comment' : '🔒 Join this event to comment'}
          </Text>
        </View>
      )}
    </View>
  )
}

const st = StyleSheet.create({
  wrapper:     { marginBottom: 8 },
  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  loadingTxt:  { fontSize: 13 },
  empty:       { fontSize: 13, paddingVertical: 16, textAlign: 'center' },

  bubble:      { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  bubbleMe:    { alignSelf: 'flex-end',   borderBottomRightRadius: 3 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius:  3 },
  bubbleHead:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  author:      { fontSize: 11, fontWeight: '700' },
  bubbleTxt:   { fontSize: 14, lineHeight: 19 },
  bubbleFoot:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 3 },
  time:        { fontSize: 10 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 24,
    paddingLeft: 10, paddingRight: 6, paddingVertical: 6,
    gap: 8, marginTop: 12,
  },
  input:    { flex: 1, fontSize: 14, maxHeight: 80, paddingVertical: 4 },
  sendBtn:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sendTxt:  { color: '#fff', fontSize: 18, fontWeight: '800' },

  locked:    { borderWidth: 1.5, borderRadius: 12, padding: 13, marginTop: 10, alignItems: 'center' },
  lockedTxt: { fontSize: 13 },
})
