'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBrokerStore } from '@/store/brokerStore'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { BrokerCard } from '@/components/BrokerCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Key, Eye, EyeOff, Check, ExternalLink, Info, Database } from 'lucide-react'

interface StoredKey {
  type: string
  isSet: boolean
  preview: string
  updatedAt: string
}

export default function SettingsPage() {
  const { brokers, reset } = useBrokerStore()
  const isAnthropicKeySet = useHoldingsAnalysisStore((s) => s.isAnthropicKeySet)
  const setAnthropicKeySet = useHoldingsAnalysisStore((s) => s.setAnthropicKeySet)

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyPreview, setKeyPreview] = useState<string | null>(null)
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)

  // Load stored keys from MongoDB on mount
  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/db/keys')
      const data = await res.json()
      if (data.success) {
        setDbConnected(true)
        const anthropicKey = (data.data as StoredKey[]).find((k) => k.type === 'anthropic')
        if (anthropicKey) {
          setAnthropicKeySet(true)
          setKeyPreview(anthropicKey.preview)
        } else {
          setAnthropicKeySet(false)
          setKeyPreview(null)
        }
      }
    } catch {
      setDbConnected(false)
    }
  }, [setAnthropicKeySet])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleSaveKey = async () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const res = await fetch('/api/db/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'anthropic', data: { apiKey: trimmed } }),
      })
      const data = await res.json()
      if (data.success) {
        setAnthropicKeySet(true)
        setKeyPreview(trimmed.slice(0, 10) + '...' + trimmed.slice(-4))
        setKeyInput('')
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveKey = async () => {
    try {
      await fetch('/api/db/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'anthropic' }),
      })
      setAnthropicKeySet(false)
      setKeyPreview(null)
      setKeyInput('')
    } catch {
      // Error handling
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage broker connections and preferences</p>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-2 text-xs">
        <Database className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">MongoDB Atlas:</span>
        {dbConnected === null ? (
          <Badge variant="secondary" className="text-[10px]">Checking...</Badge>
        ) : dbConnected ? (
          <Badge variant="secondary" className="bg-emerald-400/10 text-emerald-400 text-[10px]">Connected</Badge>
        ) : (
          <Badge variant="secondary" className="bg-red-400/10 text-red-400 text-[10px]">Not Connected</Badge>
        )}
      </div>

      {/* AI Analysis API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Claude Opus powers fundamental analysis, AI analyst signals, and stock classification
              </CardDescription>
            </div>
            {isAnthropicKeySet && (
              <Badge variant="secondary" className="bg-emerald-400/10 text-emerald-400 text-[10px]">
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key" className="text-sm">Anthropic API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="anthropic-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value)
                    setSaved(false)
                  }}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSaveKey} disabled={!keyInput.trim() || saving} size="default">
                {saved ? <Check className="h-4 w-4" /> : saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your key is encrypted with AES-256-GCM and stored in MongoDB Atlas. It never leaves the server after saving.
            </p>
          </div>

          {isAnthropicKeySet && keyPreview && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Key: {keyPreview}
              </p>
              <Button variant="ghost" size="sm" onClick={handleRemoveKey} className="text-xs text-destructive hover:text-destructive">
                Remove Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broker Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Broker Connections</CardTitle>
          <CardDescription>
            Connect and manage your trading accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brokers.map((broker) => (
              <BrokerCard key={broker.id} broker={broker} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Groww Setup Guide */}
      <Card className="border-[#5367FF]/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#5367FF]/10 flex items-center justify-center">
              <span className="text-[#5367FF] font-bold text-sm">G</span>
            </div>
            <div>
              <CardTitle className="text-base">Groww Setup Guide</CardTitle>
              <CardDescription>How to get your Groww JWT token for live data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            {[
              { step: '1', title: 'Log in to Groww', desc: <>Open <span className="font-mono text-[#5367FF]">groww.in</span> and log in to your trading account</> },
              { step: '2', title: 'Open Developer Tools', desc: <>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border">F12</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border">⌘ + Option + I</kbd> (Mac)</> },
              { step: '3', title: 'Go to Application → Cookies', desc: <>In DevTools, click <span className="font-medium">Application</span> tab → <span className="font-medium">Cookies</span> → <span className="font-mono text-[#5367FF]">groww.in</span></> },
              { step: '4', title: 'Copy the JWT token', desc: <>Find the cookie named <span className="font-mono text-[#5367FF]">groww_access_token</span> or similar auth token. Copy the full value.</> },
              { step: '5', title: 'Paste in Groww Connect above', desc: <>Click <span className="font-medium">Connect Groww</span> on the broker card above and paste the token</> },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5367FF]/10 text-[#5367FF] text-xs font-bold">{step}</span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="text-amber-400 font-medium">Note:</span> The JWT token expires periodically. You&apos;ll need to re-authenticate when it expires.</p>
              <p>Groww provides live market data including OHLCV candles, technical indicators, and portfolio data used by the AI analysis engine.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-[#5367FF]/5 border border-[#5367FF]/20 p-3">
            <ExternalLink className="h-4 w-4 text-[#5367FF] shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p><span className="text-[#5367FF] font-medium">Alternative:</span> If you have Groww API access, you can also use the API-provided JWT token directly.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dhan Setup Guide */}
      <Card className="border-[#00C7BE]/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#00C7BE]/10 flex items-center justify-center">
              <span className="text-[#00C7BE] font-bold text-sm">D</span>
            </div>
            <div>
              <CardTitle className="text-base">Dhan Setup Guide</CardTitle>
              <CardDescription>How to get your Dhan API credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            {[
              { step: '1', title: 'Go to Dhan Developer Portal', desc: <>Visit <span className="font-mono text-[#00C7BE]">dhanhq.co/developers</span> and log in</> },
              { step: '2', title: 'Create or view your App', desc: <>Navigate to <span className="font-medium">My Apps</span> and create a new app or select existing</> },
              { step: '3', title: 'Copy Client ID and Access Token', desc: <>Your <span className="font-mono text-[#00C7BE]">Client ID</span> and <span className="font-mono text-[#00C7BE]">Access Token</span> are shown on the app details page.</> },
              { step: '4', title: 'Paste in Dhan Connect above', desc: <>Click <span className="font-medium">Connect Dhan</span> on the broker card and enter both values</> },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C7BE]/10 text-[#00C7BE] text-xs font-bold">{step}</span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-[#00C7BE]/5 border border-[#00C7BE]/20 p-3">
            <Info className="h-4 w-4 text-[#00C7BE] shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>Dhan provides live holdings, positions, margins, order management, and market data. The access token is valid for one trading day and auto-expires at EOD.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Reset all broker connections and stored data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={reset}
          >
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
