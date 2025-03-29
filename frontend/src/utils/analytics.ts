import brain from "brain";

// Event types that can be tracked
export type EventType = 
  | "page_view" 
  | "upload" 
  | "template_selection" 
  | "transformation_complete" 
  | "download" 
  | "share";

// Create or retrieve a session ID from localStorage
const getSessionId = (): string => {
  const SESSION_KEY = "memeswap_session_id";
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Use crypto.randomUUID() for random session ID generation
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
};

/**
 * Track a user interaction event
 * 
 * @param eventType The type of event to track
 * @param templateId Optional template ID if relevant to the event
 * @param meta Additional metadata about the event
 * @returns Promise that resolves when tracking is complete
 */
export const trackEvent = async (
  eventType: EventType,
  templateId?: string,
  meta: Record<string, any> = {}
): Promise<void> => {
  try {
    const sessionId = getSessionId();
    
    // Use the renamed endpoints to avoid operation ID conflicts
    const response = await brain.track_faceswap_event({
      event_type: eventType,
      template_id: templateId || null,
      session_id: sessionId,
      meta: meta
    });
    
    // We can safely ignore the response, as tracking is non-critical
    // The endpoint itself handles any errors internally
  } catch (error) {
    // Silently fail so as not to disrupt user experience
    console.error("Error tracking event:", error);
  }
};

/**
 * Track a page view event
 * 
 * @param pageName Name of the page being viewed
 * @returns Promise that resolves when tracking is complete
 */
export const trackPageView = (pageName: string): Promise<void> => {
  return trackEvent("page_view", undefined, { page: pageName });
};

/**
 * Track a template selection event
 * 
 * @param templateId ID of the selected template
 * @param templateName Name of the selected template
 * @returns Promise that resolves when tracking is complete
 */
export const trackTemplateSelection = (
  templateId: string,
  templateName: string
): Promise<void> => {
  return trackEvent("template_selection", templateId, { name: templateName });
};

/**
 * Track an upload event
 * 
 * @param fileSize Size of the uploaded file in bytes
 * @param fileType MIME type of the uploaded file
 * @returns Promise that resolves when tracking is complete
 */
export const trackUpload = (
  fileSize: number,
  fileType: string
): Promise<void> => {
  return trackEvent("upload", undefined, { size: fileSize, type: fileType });
};

/**
 * Track a completed transformation event
 * 
 * @param templateId ID of the template used
 * @param processingTime Time taken to complete the transformation in ms
 * @returns Promise that resolves when tracking is complete
 */
export const trackTransformationComplete = (
  templateId: string,
  processingTime?: number
): Promise<void> => {
  return trackEvent("transformation_complete", templateId, { 
    processingTime: processingTime || null 
  });
};

/**
 * Track a download event
 * 
 * @param templateId ID of the template used
 * @returns Promise that resolves when tracking is complete
 */
export const trackDownload = (templateId: string): Promise<void> => {
  return trackEvent("download", templateId);
};

/**
 * Track a share event
 * 
 * @param templateId ID of the template used
 * @param platform Platform the image was shared to
 * @returns Promise that resolves when tracking is complete
 */
export const trackShare = (
  templateId: string,
  platform: string
): Promise<void> => {
  return trackEvent("share", templateId, { platform });
};
