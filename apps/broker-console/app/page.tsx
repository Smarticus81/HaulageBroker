'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to login page first
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-blue-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  )
}