import React from 'react';

const MapProviderSection = ({ 
  mapboxApiToken, 
  setMapboxApiToken, 
  mapInitialized, 
  onResetAndInitialize 
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
          placeholder="Your Mapbox API Token (pk.ey...)"
        />
      </div>
      
      <div className="button-group">
        <button 
          onClick={onResetAndInitialize}
          disabled={!mapboxApiToken}
          className={mapInitialized ? 'success' : ''}
        >
          {mapInitialized ? 'Mapbox Map Ready ✓' : 'Initialize Mapbox Map'}
        </button>
      </div>
    </div>
  );
};

export default MapProviderSection;