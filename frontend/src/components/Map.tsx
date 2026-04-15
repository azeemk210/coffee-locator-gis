'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Shop } from '@/lib/api'

interface MapProps {
  shops: Shop[]
  onMapClick?: (lng: number, lat: number) => void
}

interface Basemap {
  id: string
  name: string
  style: string
  icon: string
}

const BASEMAPS: Basemap[] = [
  {
    id: 'positron',
    name: 'Light Map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    icon: '🗺️',
  },
  {
    id: 'voyager',
    name: 'Colored Map',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    icon: '🎨',
  },
  {
    id: 'terrain',
    name: 'Terrain Map',
    style: 'https://demotiles.maplibre.org/style.json',
    icon: '🏔️',
  },
  {
    id: 'dark',
    name: 'Dark Map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    icon: '🌙',
  },
]

export default function Map({ shops, onMapClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [currentBasemap, setCurrentBasemap] = useState<string>('positron')
  const [showBasemapMenu, setShowBasemapMenu] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    const initialBasemap = BASEMAPS.find((b) => b.id === currentBasemap)

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialBasemap?.style || BASEMAPS[0].style,
      center: [13.04, 47.8], // Salzburg, Austria
      zoom: 13,
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl())

    // Handle map clicks
    map.current.on('click', (e) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lng, e.lngLat.lat)
      }
    })

    return () => {
      map.current?.remove()
    }
  }, [onMapClick])

  // Change basemap style
  useEffect(() => {
    if (!map.current) return

    const basemap = BASEMAPS.find((b) => b.id === currentBasemap)
    if (basemap) {
      map.current.setStyle(basemap.style)
      setShowBasemapMenu(false)
    }
  }, [currentBasemap])

  // Update markers when shops change
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers
    shops.forEach((shop) => {
      // Backend returns [lat, lng], but MapLibre needs [lng, lat]
      const [lat, lng] = shop.location.coordinates

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div>
          <h3 style="margin: 0 0 8px 0; font-weight: 600;">${shop.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">
            📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </p>
        </div>
      `)

      const marker = new maplibregl.Marker({ color: '#4CAF50' })
        .setLngLat([lng, lat]) // Convert to [lng, lat] for MapLibre
        .setPopup(popup)
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [shops])

  const currentBasemapData = BASEMAPS.find((b) => b.id === currentBasemap)

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Basemap Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowBasemapMenu(!showBasemapMenu)}
          className="bg-white border border-gray-300 rounded-lg shadow-md px-4 py-2 flex items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-sm text-gray-700"
          title="Switch map style"
        >
          <span className="text-lg">{currentBasemapData?.icon}</span>
          <span>{currentBasemapData?.name}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showBasemapMenu ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Basemap Menu */}
        {showBasemapMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden w-56">
            {BASEMAPS.map((basemap) => (
              <button
                key={basemap.id}
                onClick={() => setCurrentBasemap(basemap.id)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                  currentBasemap === basemap.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                }`}
              >
                <span className="text-xl">{basemap.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{basemap.name}</div>
                </div>
                {currentBasemap === basemap.id && (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer Info */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-md px-4 py-2 text-xs text-gray-600">
        <p className="font-medium text-gray-700 mb-1">💡 Click on map to add shops</p>
        <p className="text-gray-500">Current layer: {currentBasemapData?.name}</p>
      </div>
    </div>
  )
}
