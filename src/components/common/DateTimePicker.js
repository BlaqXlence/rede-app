/**
 * DateTimePicker.js
 * Calendar-style date picker:
 * - Past dates are greyed out and unselectable
 * - Future beyond 7 days is greyed out and unselectable
 * - Works on web (HTML input) and native
 * - Time picker is a clean dropdown-style selector
 */
import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Platform, TextInput,
  TouchableWithoutFeedback,
} from 'react-native'
import useThemeStore from '../../store/themeStore'

// Generate calendar days for a given month
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  // Empty slots before first day
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

export function DatePicker({ label, value, onChange, error }) {
  const { colors } = useThemeStore()
  const [showModal, setShowModal] = useState(false)

  const today   = new Date(); today.setHours(0,0,0,0)
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 7)

  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const days = getCalendarDays(viewYear, viewMonth)

  function isDisabled(day) {
    if (!day) return true
    const d = new Date(viewYear, viewMonth, day)
    return d < today || d > maxDate
  }

  function selectDay(day) {
    if (isDisabled(day)) return
    const d = new Date(viewYear, viewMonth, day)
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    onChange(str)
    setShowModal(false)
  }

  const displayValue = selected
    ? `${DAYS[selected.getDay()]}, ${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : 'Select date'

  // Web uses native HTML input (simpler, reliable)
  if (Platform.OS === 'web') {
    const todayStr   = today.toISOString().split('T')[0]
    const maxDateStr = maxDate.toISOString().split('T')[0]
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'Date'}</Text>
        <input
          type="date" value={value || ''} min={todayStr} max={maxDateStr}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: colors.surface, color: value ? colors.textPrimary : colors.textHint,
            border: `1.5px solid ${error ? colors.error : colors.border}`,
            borderRadius: 10, padding: '14px 14px', fontSize: 16,
            outline: 'none', colorScheme: colors.isDark ? 'dark' : 'light',
          }}
        />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </View>
    )
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'Date'}</Text>

      <TouchableOpacity
        style={[styles.selector, {
          backgroundColor: colors.surface,
          borderColor: error ? colors.error : colors.border,
        }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectorText, { color: value ? colors.textPrimary : colors.textHint }]}>
          📅  {displayValue}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      <Modal visible={showModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.calSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.calHandle} />

          {/* Month navigation */}
          <View style={styles.calNav}>
            <TouchableOpacity
              onPress={() => {
                if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) }
                else setViewMonth(m => m-1)
              }}
            >
              <Text style={[styles.calNavBtn, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.calTitle, { color: colors.textPrimary }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) }
                else setViewMonth(m => m+1)
              }}
            >
              <Text style={[styles.calNavBtn, { color: colors.primary }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.calDayHeaders}>
            {DAYS.map(d => (
              <Text key={d} style={[styles.calDayHeader, { color: colors.textHint }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.calGrid}>
            {days.map((day, i) => {
              const disabled  = isDisabled(day)
              const isSelected = day && selected &&
                selected.getFullYear() === viewYear &&
                selected.getMonth() === viewMonth &&
                selected.getDate() === day
              const isToday = day &&
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.calDay,
                    isSelected && { backgroundColor: colors.primary },
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary },
                  ]}
                  onPress={() => selectDay(day)}
                  disabled={disabled || !day}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calDayText,
                    { color: disabled ? colors.textHint : isSelected ? '#fff' : colors.textPrimary },
                    disabled && { opacity: 0.3 },
                  ]}>
                    {day || ''}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.calHint, { color: colors.textHint }]}>
            Events can be planned up to 7 days ahead
          </Text>
        </View>
      </Modal>
    </View>
  )
}

// Hours and minutes for time picker
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export function TimePicker({ label, value, onChange, error }) {
  const { colors } = useThemeStore()
  const [showModal, setShowModal] = useState(false)
  const [selHour, setSelHour]     = useState(value?.split(':')[0] || '18')
  const [selMin,  setSelMin]      = useState(value?.split(':')[1] || '00')

  function confirm() {
    onChange(`${selHour}:${selMin}`)
    setShowModal(false)
  }

  const display = value ? `${value}` : 'Select time'

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'Time'}</Text>
        <input
          type="time" value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: colors.surface, color: value ? colors.textPrimary : colors.textHint,
            border: `1.5px solid ${error ? colors.error : colors.border}`,
            borderRadius: 10, padding: '14px 14px', fontSize: 16,
            outline: 'none', colorScheme: colors.isDark ? 'dark' : 'light',
          }}
        />
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </View>
    )
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label || 'Time'}</Text>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectorText, { color: value ? colors.textPrimary : colors.textHint }]}>
          🕐  {display}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      <Modal visible={showModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.timeSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.calHandle} />
          <Text style={[styles.calTitle, { color: colors.textPrimary, marginBottom: 16 }]}>
            {label || 'Select Time'}
          </Text>
          <View style={styles.timeColumns}>
            {/* Hours */}
            <View style={styles.timeColumn}>
              <Text style={[styles.timeColLabel, { color: colors.textHint }]}>Hour</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={[styles.timeOption, selHour === h && { backgroundColor: colors.primary + '22' }]} onPress={() => setSelHour(h)}>
                    <Text style={[styles.timeOptionText, { color: selHour === h ? colors.primary : colors.textPrimary }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.timeColon, { color: colors.textPrimary }]}>:</Text>
            {/* Minutes */}
            <View style={styles.timeColumn}>
              <Text style={[styles.timeColLabel, { color: colors.textHint }]}>Min</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={[styles.timeOption, selMin === m && { backgroundColor: colors.primary + '22' }]} onPress={() => setSelMin(m)}>
                    <Text style={[styles.timeOptionText, { color: selMin === m ? colors.primary : colors.textPrimary }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <TouchableOpacity style={[styles.timeConfirm, { backgroundColor: colors.primary }]} onPress={confirm}>
            <Text style={styles.timeConfirmText}>Confirm  {selHour}:{selMin}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  field:  { marginBottom: 14 },
  label:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  error:  { fontSize: 12, marginTop: 4 },
  selector: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  selectorText: { fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  // Calendar
  calSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 40,
  },
  calHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#555',
    alignSelf: 'center', marginTop: 12, marginBottom: 12,
  },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNavBtn: { fontSize: 28, fontWeight: '300', paddingHorizontal: 8 },
  calTitle: { fontSize: 16, fontWeight: '700' },
  calDayHeaders: { flexDirection: 'row', marginBottom: 6 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: {
    width: `${100/7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, marginVertical: 2,
  },
  calDayText: { fontSize: 14, fontWeight: '500' },
  calHint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  // Time
  timeSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  timeColumns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  timeColumn: { flex: 1 },
  timeColLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
  timeOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 2 },
  timeOptionText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  timeColon: { fontSize: 28, fontWeight: '300', marginTop: 24 },
  timeConfirm: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  timeConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
