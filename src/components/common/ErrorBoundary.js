import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

export default class ErrorBoundary extends React.Component {
  state = { error: null, info: null }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('CRASH:', error.message)
    console.error('STACK:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <View style={s.wrap}>
          <Text style={s.title}>💥 Crash Details</Text>
          <ScrollView style={s.scroll}>
            <Text style={s.err}>{this.state.error.toString()}</Text>
            <Text style={s.stack}>{this.state.info?.componentStack}</Text>
          </ScrollView>
          <TouchableOpacity style={s.btn} onPress={() => this.setState({ error: null, info: null })}>
            <Text style={s.btnTxt}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const s = StyleSheet.create({
  wrap:   { flex: 1, backgroundColor: '#1a1a1a', padding: 16, paddingTop: 60 },
  title:  { color: '#FF6600', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  scroll: { flex: 1, marginBottom: 16 },
  err:    { color: '#ff4444', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  stack:  { color: '#aaa', fontSize: 11, lineHeight: 18 },
  btn:    { backgroundColor: '#FF6600', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
