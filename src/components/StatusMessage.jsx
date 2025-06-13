import React from 'react';

const StatusMessage = ({ status, statusType }) => {
  if (!status) return null;
  
  return (
    <div className={`status ${statusType}`}>
      {status}
    </div>
  );
};

export default StatusMessage;
