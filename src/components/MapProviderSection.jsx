import React from 'react';

const MapProviderSection = ({ 
  mapProvider, 
  setMapProvider, 
  mapboxApiToken, 
  setMapboxApiToken, 
  mapInitialized, 
  onResetAndInitialize 
}) => {
  return (
    <div className="map-provider-section">
      <h3>Map Provider</h3>
      <div className="input-group">
        <label>Select Map Provider:</label>
        <select 
          value={mapProvider} 
          onChange={(e) => setMapProvider(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #000000',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="maplibre">MapLibre GL JS (Free, No API Key)</option>
          <option value="mapbox">Mapbox GL JS (Requires API Key)</option>
        </select>
      </div>
      
      {mapProvider === 'mapbox' && (
        <div className="input-group">
          <label htmlFor="mapbox-token">Mapbox API Token:</label>
          <input
            id="mapbox-token"
            type="password"
            value={mapboxApiToken}
            onChange={(e) => setMapboxApiToken(e.target.value)}
            placeholder="Your Mapbox API Token (pk.ey...)"
          />
        </div>
      )}
      
      <div className="button-group">
        <button 
          onClick={onResetAndInitialize}
          disabled={mapProvider === 'mapbox' && !mapboxApiToken}
          className={mapInitialized ? 'success' : ''}
        >
          {mapInitialized ? 
            `${mapProvider === 'maplibre' ? 'MapLibre' : 'Mapbox'} Map Ready ✓` : 
            `Initialize ${mapProvider === 'maplibre' ? 'MapLibre' : 'Mapbox'} Map`
          }
        </button>
      </div>
    </div>
  );
};

export default MapProviderSection;
