'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { shopsAPI, Shop } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import Map from '@/components/Map'

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [shopsLoading, setShopsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newShopName, setNewShopName] = useState('')
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null)
  const [creating, setCreating] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Fetch shops
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchShops = async () => {
      try {
        setShopsLoading(true)
        const response = await shopsAPI.list()
        setShops(response.data)
      } catch (err: any) {
        setError('Failed to load shops')
        console.error(err)
      } finally {
        setShopsLoading(false)
      }
    }

    fetchShops()
  }, [isAuthenticated])

  const handleMapClick = (lng: number, lat: number) => {
    setSelectedCoords([lat, lng]) // Swap to [lat, lng] for display
    setShowCreateForm(true)
  }

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShopName || !selectedCoords) {
      setError('Please enter shop name and select location on map')
      return
    }

    setCreating(true)
    try {
      // Send in [lat, lng] format as expected by backend
      await shopsAPI.create(newShopName, selectedCoords)
      setNewShopName('')
      setSelectedCoords(null)
      setShowCreateForm(false)

      // Refresh shops
      const response = await shopsAPI.list()
      setShops(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create shop')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Total Shops: {shops.length}</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Map Section */}
          <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
            {shopsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
              <Map shops={shops} onMapClick={handleMapClick} />
            )}
          </div>

          {/* Right Panel */}
          <div className="w-80 bg-white rounded-lg shadow p-6 flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shops List</h2>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

            {/* Create Form */}
            {showCreateForm && (
              <form onSubmit={handleCreateShop} className="mb-4 p-4 border-2 border-green-500 rounded-lg bg-green-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                  <input
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="Enter shop name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {selectedCoords && (
                  <div className="mb-4 p-3 bg-white rounded border border-gray-200 text-sm">
                    <p className="text-gray-600">
                      📍 {selectedCoords[0].toFixed(4)}, {selectedCoords[1].toFixed(4)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-3 rounded-lg transition text-sm"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-3 rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Shops List */}
            <div className="flex-1 overflow-y-auto">
              {shops.length === 0 ? (
                <p className="text-sm text-gray-500">No shops yet. Click on the map to create one!</p>
              ) : (
                <div className="space-y-3">
                  {shops.map((shop) => (
                    <div key={shop.id} className="p-3 border border-gray-200 rounded-lg hover:border-green-500 transition cursor-pointer">
                      <h3 className="font-semibold text-gray-900 text-sm">{shop.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        📍 {shop.location.coordinates[0].toFixed(4)}, {shop.location.coordinates[1].toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">ID: {shop.id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
