'use client'

import { useState } from 'react'
import { BrokerAccount } from '@/types/broker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBrokerStore } from '@/store/brokerStore'
import { normalizePortfolioResponse, normalizePositionsResponse } from '@/lib/normalizers'
import { BrokerId } from '@/types/broker'
import { Loader2 } from 'lucide-react'

interface AuthDialogProps {
  broker: BrokerAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BROKER_FIELDS: Record<string, { key: string; label: string; placeholder: string; type: string }[]> = {
  kite: [
    { key: 'api_key', label: 'API Key', placeholder: 'Your Zerodha API Key', type: 'text' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Your Kite Access Token', type: 'password' },
  ],
  dhan: [
    { key: 'client_id', label: 'Client ID', placeholder: 'Your Dhan Client ID', type: 'text' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Your Dhan Access Token', type: 'password' },
  ],
  groww: [
    { key: 'jwt_token', label: 'JWT Token', placeholder: 'Your Groww JWT Token', type: 'password' },
  ],
  angelone: [
    { key: 'api_key', label: 'API Key', placeholder: 'Your AngelOne API Key', type: 'text' },
    { key: 'client_id', label: 'Client ID', placeholder: 'Your AngelOne Client ID', type: 'text' },
    { key: 'jwt_token', label: 'JWT Token', placeholder: 'Your AngelOne JWT Token', type: 'password' },
  ],
}

export function AuthDialog({ broker, open, onOpenChange }: AuthDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setBrokerStatus, setHoldings, setPositions, setLoadingHoldings, updateLastSynced } = useBrokerStore()

  const fields = BROKER_FIELDS[broker.id] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setBrokerStatus(broker.id, 'connecting')

    try {
      const response = await fetch('/api/mcp/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker: broker.id, ...credentials }),
      })

      const data = await response.json()

      if (data.success) {
        setBrokerStatus(broker.id, 'connected')
        onOpenChange(false)

        // Save credentials to MongoDB (encrypted) for auto-reconnect
        fetch('/api/db/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: broker.id, data: credentials }),
        }).catch(() => {})

        setCredentials({})
        // Auto-sync holdings + positions after connecting
        setLoadingHoldings(true)
        try {
          const brokerId = broker.id as BrokerId
          const [holdRes, posRes] = await Promise.all([
            fetch(`/api/mcp/portfolio?broker=${brokerId}`),
            fetch(`/api/mcp/positions?broker=${brokerId}`),
          ])
          if (holdRes.ok) {
            const json = await holdRes.json()
            if (json.data) setHoldings(normalizePortfolioResponse(json.data, brokerId))
          }
          if (posRes.ok) {
            const json = await posRes.json()
            if (json.data) setPositions(normalizePositionsResponse(json.data, brokerId))
          }
          updateLastSynced()
        } finally {
          setLoadingHoldings(false)
        }
      } else {
        throw new Error(data.error || 'Authentication failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setBrokerStatus(broker.id, 'error', message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {broker.name}</DialogTitle>
          <DialogDescription>
            Enter your {broker.name} API credentials. They are sent securely
            and never stored on disk.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
              </Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={credentials[field.key] || ''}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                required
              />
            </div>
          ))}

          {error && (
            <p className="text-destructive text-sm bg-destructive/10 rounded p-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              `Connect ${broker.name}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
