/**
 * ReviewSection.js
 * Star rating + comment reviews for events.
 * Only shown after event has ended.
 * One review per user per event.
 */
import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import colors from '../../constants/colors'
import Avatar from '../common/Avatar'
import { reviewsApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

function StarRating({ rating, onRate, readonly = false }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          onPress={() => !readonly && onRate?.(n)}
          disabled={readonly}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Text style={[styles.star, n <= rating && styles.starFilled]}>
            {n <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function ReviewSection({ eventId, eventEnded }) {
  const { user } = useAuthStore()
  const [reviews, setReviews]   = useState([])
  const [average, setAverage]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [comment, setComment]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    loadReviews()
  }, [eventId])

  async function loadReviews() {
    try {
      const data = await reviewsApi.get(eventId)
      setReviews(data.reviews)
      setAverage(data.average)
      // Check if current user already reviewed
      const mine = data.reviews.find(r => r.userId === user?.id)
      if (mine) { setMyRating(mine.rating); setComment(mine.comment || ''); setSubmitted(true) }
    } catch {
      // Reviews might not exist yet — that's fine
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (myRating === 0) {
      Alert.alert('Rate the event', 'Tap a star to rate this event')
      return
    }
    setSubmitting(true)
    try {
      await reviewsApi.create(eventId, myRating, comment.trim() || null)
      setSubmitted(true)
      loadReviews()
      Alert.alert('Thanks!', 'Your review has been posted.')
    } catch (err) {
      Alert.alert('Could not post review', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Reviews</Text>

      {/* Average rating */}
      {average && (
        <View style={styles.avgRow}>
          <Text style={styles.avgNum}>{average}</Text>
          <StarRating rating={Math.round(parseFloat(average))} readonly />
          <Text style={styles.avgCount}>({reviews.length})</Text>
        </View>
      )}

      {/* Leave a review — only after event ends */}
      {eventEnded && !submitted && user && (
        <View style={styles.reviewForm}>
          <Text style={styles.formTitle}>How was it?</Text>
          <StarRating rating={myRating} onRate={setMyRating} />
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            placeholderTextColor={colors.textHint}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Posting...' : 'Post Review'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {submitted && (
        <View style={styles.submittedBadge}>
          <Text style={styles.submittedText}>✓ You reviewed this event</Text>
          <StarRating rating={myRating} readonly />
        </View>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>
          {eventEnded ? 'No reviews yet. Be the first!' : 'Reviews appear after the event.'}
        </Text>
      ) : (
        reviews.map(r => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Avatar name={r.reviewerName} uri={r.reviewerAvatar} size={32} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.reviewerName}>{r.reviewerName || 'Anonymous'}</Text>
                <StarRating rating={r.rating} readonly />
              </View>
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { paddingTop: 8 },
  loading: { padding: 20, alignItems: 'center' },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 12,
  },
  avgRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  avgNum: { fontSize: 28, fontWeight: '900', color: colors.primary },
  avgCount: { fontSize: 13, color: colors.textSecondary },
  stars: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 20, color: colors.border },
  starFilled: { color: '#FBBF24' },
  reviewForm: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  commentInput: {
    backgroundColor: colors.surfaceHigh, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top', marginTop: 10, marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.primaryFaint, borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  submittedText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  noReviews: { fontSize: 14, color: colors.textHint, marginBottom: 16 },
  reviewCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviewComment: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
})
