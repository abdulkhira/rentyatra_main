import { useEffect, useRef } from 'react';

/**
 * Hook for monitoring performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  const startTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const endTime = Date.now();
      const renderTime = endTime - startTime.current;
      
      console.log(`🚀 ${componentName} Performance:`, {
        renderTime: `${renderTime}ms`,
        renderCount: renderCount.current,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Monitor component mount time
  useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} Mount Time: ${mountTime}ms`);
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current
  };
};

/**
 * Hook for monitoring API call performance
 */
export const useApiPerformanceMonitor = () => {
  const apiCalls = useRef([]);

  const startApiCall = (endpoint) => {
    const callId = Date.now();
    apiCalls.current.push({
      id: callId,
      endpoint,
      startTime: Date.now(),
      status: 'pending'
    });
    return callId;
  };

  const endApiCall = (callId, success = true, error = null) => {
    const call = apiCalls.current.find(c => c.id === callId);
    if (call) {
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      call.status = success ? 'success' : 'error';
      call.error = error;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API Call Performance:`, {
          endpoint: call.endpoint,
          duration: `${call.duration}ms`,
          status: call.status,
          error: call.error
        });
      }
    }
  };

  const getApiStats = () => {
    const calls = apiCalls.current;
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.status === 'success').length;
    const failedCalls = calls.filter(c => c.status === 'error').length;
    const avgDuration = calls.length > 0 
      ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length 
      : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      avgDuration: Math.round(avgDuration)
    };
  };

  return {
    startApiCall,
    endApiCall,
    getApiStats
  };
};

export default usePerformanceMonitor;
