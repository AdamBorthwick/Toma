import { useState } from 'react'
import { DbError } from '../db.js'
import { Z } from '../lib/zIndex.js'
import { colors } from '../lib/uiTokens.js'
import {
  Button,
  TextInput,
  FormLabel,
  DialogBackdrop,
  DialogCard,
  DialogTitle,
  DialogDescription,
} from './ui/index.js'

function OnboardingOverlay({ onSubmit }) {
  const [name, setName] = useState('')
  const [shelfName, setShelfName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canSubmit = name.trim() && shelfName.trim() && !loading

  return (
    <DialogBackdrop
      zIndex={Z.onboarding}
      onClose={() => {}}
      style={{ background: colors.backdropDialogHeavy }}
    >
      <DialogCard style={{ padding: '40px min(36px, 6vw)', width: 'min(360px, 92vw)' }}>
        <DialogTitle style={{ fontWeight: 800 }}>Welcome to TOMA!</DialogTitle>
        <DialogDescription style={{ marginBottom: 28 }}>Let's set up your bookshelf.</DialogDescription>

        <div style={{ marginBottom: 16 }}>
          <FormLabel>Bookshelf name</FormLabel>
          <TextInput
            value={shelfName}
            onChange={e => setShelfName(e.target.value)}
            placeholder="e.g. My Reading Nook"
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <FormLabel>Your name</FormLabel>
          <TextInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Alex"
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: colors.destructive, marginBottom: 14, lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        <Button
          fullWidth
          disabled={!canSubmit}
          size="sm"
          style={{ borderRadius: 12, background: canSubmit ? colors.primary : colors.borderAlt }}
          onClick={async () => {
            if (!canSubmit) return
            setLoading(true)
            setError('')
            try {
              await onSubmit(name.trim(), shelfName.trim())
            } catch (err) {
              setError(
                err instanceof DbError
                  ? err.message
                  : 'Could not save your shelf. Check your connection and try again.'
              )
              setLoading(false)
            }
          }}
        >
          {loading ? 'Setting up your shelf…' : 'Create my shelf'}
        </Button>
      </DialogCard>
    </DialogBackdrop>
  )
}

export { OnboardingOverlay }
