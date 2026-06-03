import React, { useState } from 'react'
import {
  View, Text, Modal, StyleSheet,
  ScrollView, Pressable, Dimensions,
  TouchableWithoutFeedback,
} from 'react-native'
import useThemeStore from '../../store/themeStore'
import { EVENT_CATEGORIES } from '../../constants/config'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.74

const WHEN_OPTIONS  = ['All time', 'Today', 'This Week', 'Weekend']
const PRICE_OPTIONS = ['Any price', 'Free only', 'Paid only']

const CAT_COLORS = {
  all: '#FF6600', party: '#EC4899', music: '#8B5CF6', sports: '#10B981',
  dancing: '#F59E0B', games: '#3B82F6', food: '#EF4444', outdoor: '#14B8A6',
  art: '#A855F7', wellness: '#06B6D4', comedy: '#F97316', kids: '#84CC16',
  fashion: '#EC4899', tech: '#6366F1',
}

// ── Collapsible group ─────────────────────────────────────────
function Group({ label, children, colors, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <View style={[gr.wrap, { borderBottomColor: colors.border }]}>
      <Pressable
        style={gr.header}
        onPress={() => setOpen(o => !o)}
        android_ripple={{ color: colors.primary + '12' }}
      >
        <Text style={[gr.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[gr.chevron, { color: colors.textHint }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && <View>{children}</View>}
    </View>
  )
}

// ── Category row — compact, image left (colored block) ────────
function CatRow({ cat, active, onPress, colors }) {
  const bg = CAT_COLORS[cat.id] || colors.primary
  return (
    <Pressable
      style={[cr.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      android_ripple={{ color: bg + '18' }}
    >
      {/* Colored block */}
      <View style={[cr.block, { backgroundColor: active ? bg : bg + '40' }]}>
        <Text style={[cr.blockTxt, { opacity: active ? 1 : 0.7 }]}>
          {cat.label.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      {/* Label */}
      <Text style={[cr.label, {
        color:      active ? colors.textPrimary : colors.textSecondary,
        fontWeight: active ? '700' : '400',
      }]}>
        {cat.label}
      </Text>

      {/* Active indicator */}
      {active && (
        <View style={[cr.dot, { backgroundColor: bg }]} />
      )}
    </Pressable>
  )
}

// ── Radio row (When / Price) ──────────────────────────────────
function RadioRow({ label, active, onPress, colors }) {
  return (
    <Pressable
      style={[rr.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      android_ripple={{ color: colors.primary + '15' }}
    >
      <Text style={[rr.label, {
        color:      active ? colors.primary : colors.textPrimary,
        fontWeight: active ? '700' : '400',
      }]}>
        {label}
      </Text>
      <View style={[rr.radio, {
        borderColor:     active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : 'transparent',
      }]}>
        {active && <View style={rr.dot} />}
      </View>
    </Pressable>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function FilterModal({ visible, onClose, filters, onApply }) {
  const { colors } = useThemeStore()
  const [category, setCategory] = useState(filters.category || 'all')
  const [when,     setWhen]     = useState(filters.when     || 'All time')
  const [price,    setPrice]    = useState(filters.price    || 'Any price')

  const isActive = category !== 'all' || when !== 'All time' || price !== 'Any price'

  function apply() { onApply({ category, when, price }); onClose() }

  function clearAll() {
    setCategory('all'); setWhen('All time'); setPrice('Any price')
    onApply({ category: 'all', when: 'All time', price: 'Any price' })
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, { backgroundColor: colors.surface, height: SHEET_H }]}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Filter Events</Text>
          <View style={s.headerRight}>
            {isActive && (
              <Pressable
                style={[s.cancelBtn, { borderColor: colors.error }]}
                onPress={clearAll}
                android_ripple={{ color: colors.error + '20' }}
              >
                <Text style={[s.cancelTxt, { color: colors.error }]}>Clear filter</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={[s.closeTxt, { color: colors.textHint }]}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Scrollable body */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Category */}
          <Group label="CATEGORY" colors={colors} defaultOpen>
            {EVENT_CATEGORIES.map(cat => (
              <CatRow
                key={cat.id}
                cat={cat}
                active={category === cat.id}
                onPress={() => setCategory(cat.id)}
                colors={colors}
              />
            ))}
          </Group>

          {/* When */}
          <Group label="WHEN" colors={colors} defaultOpen={false}>
            {WHEN_OPTIONS.map(opt => (
              <RadioRow
                key={opt}
                label={opt}
                active={when === opt}
                onPress={() => setWhen(opt)}
                colors={colors}
              />
            ))}
          </Group>

          {/* Price */}
          <Group label="PRICE" colors={colors} defaultOpen={false}>
            {PRICE_OPTIONS.map(opt => (
              <RadioRow
                key={opt}
                label={opt}
                active={price === opt}
                onPress={() => setPrice(opt)}
                colors={colors}
              />
            ))}
          </Group>

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Apply — always pinned */}
        <View style={[s.footer, { borderTopColor: colors.border }]}>
          <Pressable
            style={[s.applyBtn, { backgroundColor: colors.primary }]}
            onPress={apply}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={s.applyTxt}>Show Events</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  handle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: 17, fontWeight: '900' },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelBtn:  { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },
  cancelTxt:  { fontSize: 12, fontWeight: '700' },
  closeTxt:   { fontSize: 18, fontWeight: '400' },
  footer:     { paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  applyBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' },
  applyTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
})

const gr = StyleSheet.create({
  wrap:    { borderBottomWidth: StyleSheet.hairlineWidth },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, overflow: 'hidden' },
  label:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  chevron: { fontSize: 10 },
})

const cr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12, overflow: 'hidden' },
  block:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  blockTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  label:    { flex: 1, fontSize: 14 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
})

const rr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  label: { flex: 1, fontSize: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
})
