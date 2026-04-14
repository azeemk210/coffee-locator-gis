'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Shop } from '@/lib/api'

interface MapProps {
  shops: Shop[]
  onMapClick?: (lng: number, lat: number) => void
}

export default function Map({ shops, onMapClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Free style
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

  return <div ref={mapContainer} className="w-full h-full" />
}
