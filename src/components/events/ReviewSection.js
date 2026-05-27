/**
 * ReviewSection.js - Star ratings, post-event only
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import useAuthStore  from '../../store/authStore'
import Avatar        from '../common/Avatar'
import { reviewsApi } from '../../services/api'

function Stars({ rating, onRate, readonly }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <TouchableOpacity key={n} onPress={() => !readonly && onRate?.(n)} disabled={readonly}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
          <Text style={{ fontSize: 22, color: n <= rating ? '#FBBF24' : '#555' }}>
            {n <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function ReviewSection({ eventId, eventEnded }) {
  const { colors }    = useThemeStore()
  const { user }      = useAuthStore()
  const [reviews, setReviews]   = useState([])
  const [average, setAverage]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [comment, setComment]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => { load() }, [eventId])

  async function load() {
    try {
      const data = await reviewsApi.get(eventId)
      setReviews(data.reviews)
      setAverage(data.average)
      const mine = data.reviews.find(r => r.userId === user?.id)
      if (mine) { setMyRating(mine.rating); setComment(mine.comment||''); setSubmitted(true) }
    } catch {}
    finally { setLoading(false) }
  }

  async function handleSubmit() {
    if (myRating === 0) { Alert.alert('Rate the event', 'Tap a star first'); return }
    setSubmitting(true)
    try {
      await reviewsApi.create(eventId, myRating, comment.trim() || null)
      setSubmitted(true)
      load()
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />

  return (
    <View style={styles.wrapper}>
      {/* Average */}
      {average && (
        <View style={styles.avgRow}>
          <Text style={[styles.avgNum, { color: colors.primary }]}>{average}</Text>
          <Stars rating={Math.round(parseFloat(average))} readonly />
          <Text style={[styles.avgCount, { color: colors.textHint }]}>({reviews.length})</Text>
        </View>
      )}

      {/* Post review form */}
      {eventEnded && !submitted && user && (
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>How was it?</Text>
          <Stars rating={myRating} onRate={setMyRating} />
          {Platform.OS === 'web' ? (
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', marginTop: 10,
                backgroundColor: colors.surfaceHigh, color: colors.textPrimary,
                border: `1.5px solid ${colors.border}`, borderRadius: 10,
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                resize: 'none', outline: 'none',
              }}
            />
          ) : (
            <View style={[styles.commentInput, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}>
              <Text style={{ color: comment ? colors.textPrimary : colors.textHint, fontSize: 14 }}>
                {comment || 'Share your experience...'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.5 : 1 }]}
            onPress={handleSubmit} disabled={submitting}
          >
            <Text style={styles.submitBtnTxt}>{submitting ? 'Posting...' : 'Post Review'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {submitted && (
        <View style={[styles.submittedRow, { backgroundColor: colors.primaryFaint }]}>
          <Text style={[styles.submittedTxt, { color: colors.primary }]}>✓ You reviewed this event</Text>
          <Stars rating={myRating} readonly />
        </View>
      )}

      {!eventEnded && (
        <Text style={[styles.notEnded, { color: colors.textHint }]}>
          Reviews available after the event ends
        </Text>
      )}

      {/* Review list */}
      {reviews.map(r => (
        <View key={r.id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
          <View style={styles.reviewHeader}>
            <Avatar name={r.reviewerName} uri={r.reviewerAvatar} size={30} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>
                {r.reviewerName || 'Anonymous'}
              </Text>
              <Stars rating={r.rating} readonly />
            </View>
          </View>
          {r.comment ? <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{r.comment}</Text> : null}
        </View>
      ))}

      {reviews.length === 0 && eventEnded && !submitted && (
        <Text style={[styles.noReviews, { color: colors.textHint }]}>No reviews yet</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper:      { marginBottom: 8 },
  avgRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  avgNum:       { fontSize: 28, fontWeight: '900' },
  avgCount:     { fontSize: 13 },
  form:         { borderRadius: 14, padding: 14, marginBottom: 14 },
  formTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  commentInput: { borderRadius: 10, borderWidth: 1.5, padding: 12, minHeight: 80, marginTop: 10, marginBottom: 12 },
  submitBtn:    { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  submittedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12, marginBottom: 12 },
  submittedTxt: { fontSize: 13, fontWeight: '600' },
  notEnded:     { fontSize: 13, marginBottom: 12 },
  noReviews:    { fontSize: 13, marginBottom: 8 },
  reviewCard:   { borderRadius: 12, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerName: { fontSize: 13, fontWeight: '700' },
  reviewComment:{ fontSize: 13, lineHeight: 18, marginTop: 4 },
})
