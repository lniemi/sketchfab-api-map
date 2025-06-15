import React from 'react';

const ModelSection = ({ 
  sketchfabUID,
  setSketchfabUID,
  sketchfabApiToken,
  setSketchfabApiToken,
  modelPassword,
  setModelPassword,
  onDownloadSketchfabModel,
  onLoadDefaultModel,
  currentLayer,
  onRemoveModel,
  isAnimating,
  animationType,
  onStartAnimation,
  onStopAnimation
}) => {
  return (    <div className="model-section">
      <h3>Load 3D Model from Sketchfab</h3>
      
      {!import.meta.env.VITE_SKETCHFAB_API_TOKEN && (
        <div className="input-group">
          <label htmlFor="sketchfab-token">Sketchfab API Token:</label>
          <input
            id="sketchfab-token"
            type="password"
            value={sketchfabApiToken}
            onChange={(e) => setSketchfabApiToken(e.target.value)}
            placeholder="Your Sketchfab API Token (optional)"
          />
        </div>
      )}

      <div className="input-group">
        <label htmlFor="uid">Sketchfab Model UID:</label>
        <input
          id="uid"
          type="text"
          value={sketchfabUID}
          onChange={(e) => setSketchfabUID(e.target.value)}
          placeholder="e.g., ac2b507090fd4966a5109512a78cf73e"
        />
      </div>

      <div className="input-group">
        <label htmlFor="password">Model Password (if required):</label>
        <input
          id="password"
          type="password"
          value={modelPassword}
          onChange={(e) => setModelPassword(e.target.value)}
          placeholder="Leave empty if not password-protected"
        />
      </div>

      <div className="button-group">
        <button onClick={onDownloadSketchfabModel}>
          Load Sketchfab Model
        </button>
        <button onClick={onLoadDefaultModel}>
          Load Default Model
        </button>
      </div>

      {currentLayer && (
        <>
          <div className="button-group" style={{ marginTop: '10px' }}>
            <button onClick={onRemoveModel} className="remove">
              Remove Model
            </button>
          </div>
          
          <div className="animation-section">
            <h3>Animations</h3>
            <div className="button-group">
              <button 
                onClick={() => onStartAnimation('broomBroom')}
                disabled={isAnimating}
                className={isAnimating && animationType === 'broomBroom' ? 'success' : ''}
              >
                {isAnimating && animationType === 'broomBroom' ? 'Broom Broom! 🏎️' : 'Broom Broom'}
              </button>
            </div>
            {isAnimating && (
              <div className="button-group" style={{ marginTop: '10px' }}>
                <button onClick={onStopAnimation} className="remove">
                  Stop Animation
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSection;
