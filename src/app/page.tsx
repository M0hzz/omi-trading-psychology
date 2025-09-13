"use client"

import { useAuth } from '@/components/auth/AuthProvider'
import { MoodEntryService } from '@/entities/MoodEntry'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Upload } from 'lucide-react'
import { useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import Dashboard from '@/components/dashboard/Dashboard'

function HomePage() {
  const { user } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  const handleMigration = async () => {
    setMigrating(true)
    try {
      await MoodEntryService.migrateFromLocalStorage()
      setMigrationComplete(true)
    } catch (error) {
      console.error('Migration failed:', error)
    }
    setMigrating(false)
  }

  const localStorageHasData = () => {
    if (typeof window === 'undefined') return false
    const data = localStorage.getItem('omi_mood_entries')
    return data && JSON.parse(data).length > 0
  }

  return (
    <div className="space-y-6">
      {/* Migration Card - Only show if user is logged in and has local data */}
      {user && localStorageHasData() && !migrationComplete && (
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Migrate Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-200 mb-4">
              We found existing mood tracking data on this device. Would you like to migrate it to your cloud account? 
              This will sync your data across all devices and keep it safe.
            </p>
            <Button 
              onClick={handleMigration}
              disabled={migrating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {migrating ? 'Migrating...' : 'Migrate Data'}
            </Button>
          </CardContent>
        </Card>
      )}

      {migrationComplete && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-green-300">✅ Data migration completed successfully!</p>
          </CardContent>
        </Card>
      )}

      <Dashboard />
    </div>
  )
}

export default function Page() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  )
}