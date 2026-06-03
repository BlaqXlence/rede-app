/**
 * EventDetailScreen — redesigned
 * - Full-bleed hero image, fixed behind content
 * - Floating back/heart/share on image
 * - Content card with rounded top corners scrolls UP over image
 * - All info clean and readable on dark + light
 * - Comments + Attendees as bottom tabs, easily accessible
 * - Pinned footer: price + Join/Leave button
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, Image, ScrollView, Animated,
  StyleSheet, Alert, Linking, Dimensions,
  Platform, StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Svg, Path }     from 'react-native-svg'
import useThemeStore     from '../../store/themeStore'
import useEventsStore    from '../../store/eventsStore'
import useAuthStore      from '../../store/authStore'
import Avatar            from '../../components/common/Avatar'
import CommentSection    from '../../components/events/CommentSection'
import AttendeesSection  from '../../components/events/AttendeesSection'
import ShareModal        from '../../components/common/ShareModal'
import { staticMapUrl } from '../../services/places'
import { formatDateRange, formatUGX, timeFromNow } from '../../utils/formatters'
import { EVENT_CATEGORIES, APP_URL } from '../../constants/config'
import { eventsApi }    from '../../services/api'
import Tap              from '../../components/common/Tap'

const { width, height: SCREEN_H } = Dimensions.get('window')
const MAX_W      = Math.min(width, 500)
const IMG_H      = Math.round(SCREEN_H * 0.42)   // 42% of screen
const CARD_TOP   = IMG_H - 32                     // card overlaps image by 32px
const TABS       = ['About', 'Comments', 'Attendees']

function ShareIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M8 7l4-4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  )
}

function InfoRow({ label, value, valueColor, colors }) {
  if (!value) return null
  return (
    <View style={[ir.row, { borderBottomColor: colors.border }]}>
      <Text style={[ir.label, { color: colors.textHint }]}>{label}</Text>
      <Text style={[ir.value, { color: valueColor || colors.textPrimary }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

function StatBox({ label, value, color, colors }) {
  return (
    <View style={sb.box}>
      <Text style={[sb.value, { color: color || colors.textPrimary }]}>{value}</Text>
      <Text style={[sb.label, { color: colors.textHint }]}>{label}</Text>
    </View>
  )
}

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: fromParams } = route.params || {}
  const insets  = useSafeAreaInsets()
  const { colors }  = useThemeStore()
  const { getEventById, joinEvent, leaveEvent, isAttending,
          checkAttending, deleteEventLocal, toggleLike, likedEvents } = useEventsStore()
  const { user }    = useAuthStore()

  const [activeTab,  setActiveTab]  = useState('About')
  const [deleting,   setDeleting]   = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [justJoined, setJustJoined] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const scrollY = useRef(new Animated.Value(0)).current

  const storeEvent = getEventById(eventId || fromParams?.id)
  const event      = storeEvent || fromParams

  const attending   = isAttending(event?.id)
  const isLiked     = likedEvents?.includes(event?.id)
  const isOrganizer = event?.organizer?.id === user?.id
  const isFull      = event?.maxAttendees && (event?.attendeeCount || 0) >= event?.maxAttendees
  const catColor    = colors.cat?.[event?.category] || colors.primary
  const catMeta     = EVENT_CATEGORIES.find(c => c.id === event?.category)
  const spotsLeft   = event?.maxAttendees
    ? Math.max(0, event.maxAttendees - (event.attendeeCount || 0))
    : null

  const venueStr = [
    event?.location?.venueName || event?.location?.name,
    event?.location?.area,
  ].filter(Boolean).join(', ')

  useEffect(() => {
    if (user && event?.id) checkAttending(event.id).catch(() => {})
  }, [event?.id, user?.id])

  if (!event) {
    return (
      <View style={[s.safe, { backgroundColor: colors.background }]}>
        <Tap style={{ padding: 20, paddingTop: 20 + insets.top }} onPress={() => navigation.goBack()}>
          <Text style={[{ color: colors.primary, fontSize: 15, fontWeight: '600' }]}>← Back</Text>
        </Tap>
        <View style={s.center}>
          <Text style={{ color: colors.textSecondary }}>Event not found</Text>
        </View>
      </View>
    )
  }

  function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', 'Create an account to join events.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Phone') },
      ]); return
    }
    if (attending) {
      const isPaid    = (event.entryFee || 0) > 0
      const hoursLeft = (new Date(event.startTime) - Date.now()) / 3_600_000
      if (isPaid && hoursLeft > 0 && hoursLeft < 3) {
        Alert.alert('Cannot leave', `You can only leave paid events 3+ hours before they start.`); return
      }
      Alert.alert('Leave event?', 'You will be removed from the attendees list.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(event.id).catch(e => Alert.alert('Error', e.message)) },
      ])
    } else {
      joinEvent(event.id)
        .then(() => { setJustJoined(true); Alert.alert("You're in!", `See you at ${event.title}`) })
        .catch(e => Alert.alert('Could not join', e.message))
    }
  }

  function handleDelete() {
    if (!isOrganizer) return
    const msg = (event.attendeeCount || 0) > 0
      ? `"${event.title}" has ${event.attendeeCount} attendee(s). They will be notified. Delete anyway?`
      : `"${event.title}" will be permanently removed.`
    Alert.alert('Delete event?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true)
        try { await eventsApi.delete(event.id); deleteEventLocal(event.id); navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }) }
        catch (e) { Alert.alert('Error', e.message); setDeleting(false) }
      }},
    ])
  }

  function openMaps() {
    const loc = event.location
    if (loc?.mapsLink) Linking.openURL(loc.mapsLink)
    else if (loc?.lat && loc?.lng) Linking.openURL(`https://maps.google.com/?q=${loc.lat},${loc.lng}`)
    else if (venueStr) Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(venueStr + ' ' + (loc?.city || 'Uganda'))}`)
  }

  // Image parallax: image scrolls at half speed
  const imgTranslate = scrollY.interpolate({
    inputRange:  [0, IMG_H],
    outputRange: [0, -IMG_H / 2],
    extrapolate: 'clamp',
  })

  // Floating nav opacity: fade out as user scrolls into content
  const navOpacity = scrollY.interpolate({
    inputRange:  [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const footerH = 72 + insets.bottom

  return (
    <View style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={[s.phone, { maxWidth: MAX_W }]}>

        {/* ── Hero image (fixed behind content) ── */}
        <Animated.View style={[s.heroWrap, { transform: [{ translateY: imgTranslate }] }]}>
          <Image
            source={{ uri: event.coverImage }}
            style={[s.hero, { height: IMG_H + 40 }]}
            resizeMode="cover"
          />
          {/* Gradient overlay bottom of image */}
          <View style={s.heroGradient} />
          {event.isNow && (
            <View style={[s.liveBadge, { backgroundColor: colors.error }]}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE NOW</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Floating nav buttons on image ── */}
        <Animated.View
          style={[s.floatNav, { top: insets.top + 8, opacity: navOpacity }]}
          pointerEvents="box-none"
        >
          <Tap style={[s.floatBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => navigation.goBack()}>
            <Text style={s.floatBtnTxt}>←</Text>
          </Tap>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tap
              style={[s.floatBtn, { backgroundColor: isLiked ? '#EF444466' : 'rgba(0,0,0,0.45)' }]}
              onPress={() => event?.id && toggleLike(event.id)}
            >
              <Text style={[s.floatBtnTxt, { color: isLiked ? '#EF4444' : '#fff' }]}>
                {isLiked ? '♥' : '♡'}
              </Text>
            </Tap>
            <Tap style={[s.floatBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => setShareModal(true)}>
              <ShareIcon color="#fff" />
            </Tap>
          </View>
        </Animated.View>

        {/* ── Sticky back button (visible when floating fades out) ── */}
        <View style={[s.stickyBack, { top: insets.top + 8 }]} pointerEvents="box-none">
          <Animated.View style={{ opacity: scrollY.interpolate({ inputRange: [60, 100], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
            <Tap style={[s.floatBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
              <Text style={[s.floatBtnTxt, { color: colors.primary }]}>←</Text>
            </Tap>
          </Animated.View>
        </View>

        {/* ── Scrollable content ── */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: footerH + 20 }}
        >
          {/* Spacer so content starts at CARD_TOP */}
          <View style={{ height: CARD_TOP }} />

          {/* ── Content card — rounded top, slides over image ── */}
          <View style={[s.card, { backgroundColor: colors.background }]}>

            {/* Category + time */}
            <View style={s.cardTopRow}>
              <View style={[s.catPill, { backgroundColor: catColor + '22' }]}>
                <Text style={[s.catTxt, { color: catColor }]}>
                  {catMeta?.label?.toUpperCase() || ''}
                </Text>
              </View>
              <Text style={[s.timeAway, { color: colors.textSecondary }]}>
                {timeFromNow(event.startTime)}
              </Text>
            </View>

            {/* Title */}
            <Text style={[s.title, { color: colors.textPrimary }]}>{event.title}</Text>

            {/* Organiser actions */}
            {isOrganizer && (
              <View style={s.orgActions}>
                <Tap style={[s.orgBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('EditEvent', { event })}>
                  <Text style={s.orgBtnTxt}>Edit Event</Text>
                </Tap>
                <Tap style={[s.orgBtn, { borderWidth: 1.5, borderColor: colors.error }]}
                  onPress={handleDelete} disabled={deleting}>
                  <Text style={[s.orgBtnTxt, { color: colors.error }]}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </Tap>
              </View>
            )}

            {/* ── Stats row ── */}
            <View style={[s.statsRow, { backgroundColor: colors.surface }]}>
              <StatBox
                label="Entry"
                value={formatUGX(event.entryFee)}
                color={event.entryFee === 0 ? colors.success : colors.primary}
                colors={colors}
              />
              <View style={[s.statDiv, { backgroundColor: colors.border }]} />
              <StatBox
                label="Going"
                value={String(event.attendeeCount || 0)}
                colors={colors}
              />
              {spotsLeft !== null && (
                <>
                  <View style={[s.statDiv, { backgroundColor: colors.border }]} />
                  <StatBox
                    label="Spots left"
                    value={spotsLeft === 0 ? 'Full' : String(spotsLeft)}
                    color={spotsLeft === 0 ? colors.error : spotsLeft <= 5 ? '#F59E0B' : colors.success}
                    colors={colors}
                  />
                </>
              )}
              {event.avgRating > 0 && (
                <>
                  <View style={[s.statDiv, { backgroundColor: colors.border }]} />
                  <StatBox
                    label="Rating"
                    value={`${Number(event.avgRating).toFixed(1)} ★`}
                    colors={colors}
                  />
                </>
              )}
            </View>

            {/* ── Info rows ── */}
            <View style={[s.infoCard, { backgroundColor: colors.surface }]}>
              <InfoRow label="DATE" value={formatDateRange(event.startTime, event.endTime)} colors={colors} />
              {!!venueStr && <InfoRow label="VENUE" value={venueStr} colors={colors} />}
              {!!event.location?.city && <InfoRow label="CITY" value={event.location.city} colors={colors} />}
            </View>

            {/* Maps button */}
            {(event.location?.lat || event.location?.mapsLink || venueStr) && (
              <Tap
                style={[s.mapsBtn, { borderColor: colors.border }]}
                onPress={openMaps}
              >
                <Text style={[s.mapsBtnTxt, { color: colors.primary }]}>Open in Google Maps  →</Text>
              </Tap>
            )}

            {/* Static map */}
            {!!(event.location?.lat && event.location?.lng) && (
              <Tap onPress={openMaps} style={s.mapImgWrap}>
                <Image
                  source={{ uri: staticMapUrl(event.location.lat, event.location.lng, 800, 280) }}
                  style={s.mapImg}
                  resizeMode="cover"
                />
                <View style={[s.mapImgOverlay, { backgroundColor: colors.primary }]}>
                  <Text style={s.mapImgOverlayTxt}>Navigate  →</Text>
                </View>
              </Tap>
            )}

            {/* Organiser */}
            <Tap
              style={[s.organizer, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Organizer', { organizerId: event.organizer?.id })}
            >
              <Avatar uri={event.organizer?.avatar} name={event.organizer?.name} size={42} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[s.orgByLabel, { color: colors.textHint }]}>ORGANISED BY</Text>
                <Text style={[s.orgName, { color: colors.textPrimary }]}>
                  {event.organizer?.name}{event.organizer?.verified ? '  ✓' : ''}
                </Text>
              </View>
              <Text style={[{ color: colors.textHint, fontSize: 22 }]}>›</Text>
            </Tap>

            {/* ── Tabs: About | Comments | Attendees ── */}
            <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
              {TABS.map(t => (
                <Tap
                  key={t}
                  style={[s.tab, activeTab === t && [s.tabActive, { borderBottomColor: colors.primary }]]}
                  onPress={() => setActiveTab(t)}
                >
                  <Text style={[s.tabTxt, { color: activeTab === t ? colors.primary : colors.textSecondary }]}>
                    {t}
                  </Text>
                </Tap>
              ))}
            </View>

            {/* About */}
            {activeTab === 'About' && (
              <View style={s.aboutWrap}>
                <Text
                  style={[s.desc, { color: colors.textSecondary }]}
                  numberOfLines={descExpanded ? undefined : 4}
                >
                  {event.description}
                </Text>
                {(event.description?.length || 0) > 200 && (
                  <Tap onPress={() => setDescExpanded(x => !x)}>
                    <Text style={[s.readMore, { color: colors.primary }]}>
                      {descExpanded ? 'Show less' : 'Read more'}
                    </Text>
                  </Tap>
                )}
              </View>
            )}

            {/* Comments */}
            {activeTab === 'Comments' && (
              <CommentSection eventId={event.id} isOrganizer={isOrganizer} justJoined={justJoined} />
            )}

            {/* Attendees */}
            {activeTab === 'Attendees' && (
              <AttendeesSection
                eventId={event.id}
                attendeeCount={event.attendeeCount}
                onPressAttendee={a => navigation.navigate('Organizer', { organizerId: a.id })}
              />
            )}
          </View>
        </Animated.ScrollView>

        {/* ── Pinned footer ── */}
        <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          {isOrganizer ? (
            <View style={s.footerOrg}>
              <Text style={[s.footerOrgTxt, { color: colors.textSecondary }]}>You organised this event</Text>
            </View>
          ) : (
            <>
              <View>
                <Text style={[s.footerLabel, { color: colors.textHint }]}>Entry fee</Text>
                <Text style={[s.footerPrice, { color: event.entryFee === 0 ? colors.success : colors.primary }]}>
                  {formatUGX(event.entryFee)}
                </Text>
              </View>
              <Tap
                style={[
                  s.joinBtn,
                  attending
                    ? { borderWidth: 2, borderColor: colors.primary }
                    : { backgroundColor: isFull ? colors.border : colors.primary },
                ]}
                onPress={handleJoin}
                disabled={isFull && !attending}
              >
                <Text style={[s.joinTxt, attending && { color: colors.primary }]}>
                  {!user ? 'Sign in to Join'
                    : attending ? 'Leave Event'
                    : isFull ? 'Event Full'
                    : 'Join Event'}
                </Text>
              </Tap>
            </>
          )}
        </View>

        <ShareModal visible={shareModal} onClose={() => setShareModal(false)} event={event} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, alignItems: 'center' },
  phone:     { flex: 1, width: '100%', overflow: 'hidden' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  heroWrap:  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },
  hero:      { width: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.35)' },
  liveBadge: { position: 'absolute', bottom: 90, left: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTxt:   { color: '#fff', fontSize: 11, fontWeight: '800' },

  floatNav:  { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  stickyBack:{ position: 'absolute', left: 16, zIndex: 10 },
  floatBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  floatBtnTxt:{ color: '#fff', fontSize: 20, fontWeight: '700' },

  card:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: SCREEN_H, zIndex: 1, padding: 20, paddingTop: 24 },
  cardTopRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catPill:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catTxt:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  timeAway:  { fontSize: 13, fontWeight: '500' },
  title:     { fontSize: 22, fontWeight: '900', lineHeight: 30, marginBottom: 16 },

  orgActions:{ flexDirection: 'row', gap: 10, marginBottom: 16 },
  orgBtn:    { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  orgBtnTxt: { fontWeight: '700', fontSize: 13, color: '#fff' },

  statsRow:  { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  statDiv:   { width: 1, height: 34, marginHorizontal: 4 },

  infoCard:  { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  mapsBtn:   { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  mapsBtnTxt:{ fontSize: 13, fontWeight: '700' },
  mapImgWrap:{ borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  mapImg:    { width: '100%', height: 160 },
  mapImgOverlay: { paddingVertical: 10, alignItems: 'center' },
  mapImgOverlayTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  organizer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 16 },
  orgByLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.6, marginBottom: 3 },
  orgName:   { fontSize: 15, fontWeight: '700' },

  tabBar:    { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 0 },
  tab:       { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5 },
  tabTxt:    { fontSize: 13, fontWeight: '700' },

  aboutWrap: { paddingTop: 16 },
  desc:      { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  readMore:  { fontSize: 13, fontWeight: '700', marginBottom: 16 },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  footerOrg: { flex: 1, alignItems: 'center' },
  footerOrgTxt: { fontSize: 14, fontWeight: '600' },
  footerLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginBottom: 2 },
  footerPrice:  { fontSize: 18, fontWeight: '900' },
  joinBtn:   { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  joinTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
})

const ir = StyleSheet.create({
  row:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, width: 44, marginTop: 3 },
  value: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
})

const sb = StyleSheet.create({
  box:   { flex: 1, alignItems: 'center', paddingVertical: 4 },
  value: { fontSize: 15, fontWeight: '900', marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600' },
})
