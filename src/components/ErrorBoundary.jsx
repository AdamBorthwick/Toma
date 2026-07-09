import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          padding: 24,
          background: '#223152',
          color: '#FDF8EF',
          fontFamily: "'Manrope', sans-serif",
          boxSizing: 'border-box',
        }}>
          <div style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: 28, marginBottom: 12 }}>TOMA!</div>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Something went wrong</p>
          <pre style={{
            margin: 0,
            padding: 12,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export { ErrorBoundary }
