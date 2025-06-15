import React from 'react';

const MapProviderSection = ({ 
  mapboxApiToken, 
  setMapboxApiToken, 
  mapInitialized,
  mapError
}) => {
  return (
    <div className="map-provider-section">
      <h3>Mapbox Configuration</h3>
      
      <div className="input-group">
        <label htmlFor="mapbox-token">Mapbox API Token:</label>
        <input
          id="mapbox-token"
          type="password"
          value={mapboxApiToken}
          onChange={(e) => setMapboxApiToken(e.target.value)}
          placeholder={mapboxApiToken ? "Loaded from .env file" : "Your Mapbox API Token (pk.ey...)"}
        />
        {mapboxApiToken && (
          <small style={{ color: '#666', fontSize: '11px' }}>
            {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? '✓ Loaded from .env' : '✓ Custom token'}
          </small>
        )}
      </div>
      
      <div className="status-indicator">
        {mapInitialized ? (
          <div style={{ color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>
            ✓ Map Ready
          </div>
        ) : mapError ? (
          <div style={{ color: '#dc3545', fontSize: '14px' }}>
            ✗ {mapError}
          </div>
        ) : mapboxApiToken ? (
          <div style={{ color: '#ffc107', fontSize: '14px' }}>
            ⏳ Initializing map...
          </div>
        ) : (
          <div style={{ color: '#6c757d', fontSize: '14px' }}>
            Waiting for API token...
          </div>
        )}
      </div>
    </div>
  );
};

export default MapProviderSection;