/**
 * DateTimePicker.js
 *
 * Custom calendar + time picker that works on web, iOS and Android.
 * Past dates are greyed and untappable on all platforms.
 * Maximum 7 days ahead.
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TouchableWithoutFeedback,
} from 'react-native'
import useThemeStore from '../../store/themeStore'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']
const HOURS  = Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0'))
const MINS   = ['00','15','30','45']

function calDays(year, month) {
  const first = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  const arr   = []
  for (let i = 0; i < first; i++) arr.push(null)
  for (let i = 1; i <= count; i++) arr.push(i)
  return arr
}

/* ── Date picker ─────────────────────────────────────────────── */
export function DatePicker({ label, value, onChange, error }) {
  const { colors }      = useThemeStore()
  const [open, setOpen] = useState(false)

  const today   = new Date(); today.setHours(0,0,0,0)
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 7)
  const selected = value ? new Date(value + 'T00:00:00') : null

  const [vy, setVY] = useState(today.getFullYear())
  const [vm, setVM] = useState(today.getMonth())
  const days        = calDays(vy, vm)

  function isPast(day) {
    if (!day) return true
    return new Date(vy, vm, day) < today
  }
  function isFuture(day) {
    if (!day) return true
    return new Date(vy, vm, day) > maxDate
  }
  function isDisabled(day) { return !day || isPast(day) || isFuture(day) }

  function pick(day) {
    if (isDisabled(day)) return
    const d   = new Date(vy, vm, day)
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    onChange(str)
    setOpen(false)
  }

  const label2 = selected
    ? `${DAYS[selected.getDay()]}, ${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : 'Tap to select date'

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'DATE'}</Text>

      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
        <Text style={[styles.selectorTxt, { color: selected ? colors.textPrimary : colors.textHint }]}>
          {label2}
        </Text>
        <Text style={[styles.chev, { color: colors.textHint }]}>›</Text>
      </TouchableOpacity>

      {error ? <Text style={[styles.err, { color: colors.error }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Month nav */}
          <View style={styles.nav}>
            <TouchableOpacity onPress={() => {
              if (vm === 0) { setVY(y => y-1); setVM(11) } else setVM(m => m-1)
            }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.navBtn, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.textPrimary }]}>{MONTHS[vm]} {vy}</Text>
            <TouchableOpacity onPress={() => {
              if (vm === 11) { setVY(y => y+1); setVM(0) } else setVM(m => m+1)
            }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.navBtn, { color: colors.primary }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {DAYS.map(d => (
              <Text key={d} style={[styles.weekDay, { color: colors.textHint }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {days.map((day, i) => {
              const disabled = isDisabled(day)
              const isSel    = day && selected &&
                selected.getFullYear() === vy && selected.getMonth() === vm && selected.getDate() === day
              const isTod    = day &&
                today.getFullYear() === vy && today.getMonth() === vm && today.getDate() === day

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.day,
                    isSel && { backgroundColor: colors.primary, borderRadius: 20 },
                    isTod && !isSel && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 20 },
                  ]}
                  onPress={() => pick(day)}
                  disabled={disabled || !day}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayTxt,
                    { color: disabled ? colors.textHint : isSel ? '#fff' : colors.textPrimary },
                    disabled && { opacity: 0.3 },
                  ]}>
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.hint, { color: colors.textHint }]}>
            Events can be posted up to 7 days ahead
          </Text>
        </View>
      </Modal>
    </View>
  )
}

/* ── Time picker ─────────────────────────────────────────────── */
export function TimePicker({ label, value, onChange, error }) {
  const { colors }      = useThemeStore()
  const [open, setOpen] = useState(false)
  const [selH, setSelH] = useState(value ? value.split(':')[0] : '18')
  const [selM, setSelM] = useState(value ? value.split(':')[1] : '00')

  function confirm() {
    onChange(`${selH}:${selM}`)
    setOpen(false)
  }

  const display = value
    ? (() => {
        const [h, m] = value.split(':')
        const hr = parseInt(h)
        return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`
      })()
    : 'Tap to select time'

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'TIME'}</Text>

      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>🕐</Text>
        <Text style={[styles.selectorTxt, { color: value ? colors.textPrimary : colors.textHint }]}>
          {display}
        </Text>
        <Text style={[styles.chev, { color: colors.textHint }]}>›</Text>
      </TouchableOpacity>

      {error ? <Text style={[styles.err, { color: colors.error }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.navTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
            {label || 'Select Time'}
          </Text>

          <View style={styles.timeRow}>
            {/* Hours */}
            <View style={styles.timeCol}>
              <Text style={[styles.timeColLabel, { color: colors.textHint }]}>Hour</Text>
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeItem, selH === h && { backgroundColor: colors.primaryFaint }]}
                    onPress={() => setSelH(h)}
                  >
                    <Text style={[styles.timeItemTxt, { color: selH === h ? colors.primary : colors.textPrimary }]}>
                      {parseInt(h) % 12 || 12} {parseInt(h) < 12 ? 'AM' : 'PM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minutes */}
            <View style={styles.timeCol}>
              <Text style={[styles.timeColLabel, { color: colors.textHint }]}>Minute</Text>
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {MINS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timeItem, selM === m && { backgroundColor: colors.primaryFaint }]}
                    onPress={() => setSelM(m)}
                  >
                    <Text style={[styles.timeItemTxt, { color: selM === m ? colors.primary : colors.textPrimary }]}>
                      :{m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={confirm}
          >
            <Text style={styles.confirmTxt}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  field:  { marginBottom: 16 },
  label:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  selectorTxt: { flex: 1, fontSize: 15 },
  chev: { fontSize: 18 },
  err:  { fontSize: 12, marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 40,
  },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  nav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:   { fontSize: 28, fontWeight: '300', paddingHorizontal: 8 },
  navTitle: { fontSize: 16, fontWeight: '800' },
  weekRow:  { flexDirection: 'row', marginBottom: 8 },
  weekDay:  { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  day:      { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayTxt:   { fontSize: 14, fontWeight: '500' },
  hint:     { fontSize: 12, textAlign: 'center' },

  timeRow:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  timeCol:     { flex: 1 },
  timeColLabel:{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
  timeScroll:  { height: 200 },
  timeItem:    { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4, alignItems: 'center' },
  timeItemTxt: { fontSize: 16, fontWeight: '600' },
  confirmBtn:  { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
})
