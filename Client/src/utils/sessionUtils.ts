
export const getVisitorSessionId = (): string => {
  let sessionId = localStorage.getItem('chareli_visitor_id');
  
  if (!sessionId) {
    sessionId = sessionStorage.getItem('visitor_session_id');
    
    if (sessionId) {
      // Migrate from sessionStorage to localStorage
      localStorage.setItem('chareli_visitor_id', sessionId);
      sessionStorage.removeItem('visitor_session_id');
    }
  }
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID();
    localStorage.setItem('chareli_visitor_id', sessionId);
    
    // Set expiration (optional - 1 year from now)
    const expirationTime = Date.now() + (365 * 24 * 60 * 60 * 1000);
    localStorage.setItem('chareli_visitor_expires', expirationTime.toString());
  }
  
  return sessionId;
};


export const clearVisitorSession = (): void => {
  localStorage.removeItem('chareli_visitor_id');
  localStorage.removeItem('chareli_visitor_expires');
  sessionStorage.removeItem('visitor_session_id'); 
};


export const isVisitorSessionExpired = (): boolean => {
  const expirationTime = localStorage.getItem('chareli_visitor_expires');
  if (!expirationTime) {
    return false; // No expiration set, consider it valid
  }
  
  return Date.now() > parseInt(expirationTime);
};


export const refreshVisitorSession = (): void => {
  const sessionId = getVisitorSessionId();
  if (sessionId) {
    const expirationTime = Date.now() + (365 * 24 * 60 * 60 * 1000);
    localStorage.setItem('chareli_visitor_expires', expirationTime.toString());
  }
};
