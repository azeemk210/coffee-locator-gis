'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🗺️ GIS Portal</h1>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="text-sm text-gray-600 mb-2">Logged in as:</div>
        <div className="font-semibold text-gray-900 text-sm mb-1">{user?.email}</div>
        <div className="text-xs text-gray-500">Role: {user?.role}</div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-800">
        <p className="font-semibold mb-2">📍 Create Shop</p>
        <p>Click on the map to select a location for a new shop.</p>
      </div>

      {/* Shops List Placeholder */}
      <div className="flex-1 overflow-y-auto mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Shops</h2>
        <p className="text-sm text-gray-500">Shops list will appear here and on the map.</p>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        Logout
      </button>
    </div>
  )
}
