/** AdGenerationRequest */
export interface AdGenerationRequest {
  /** Prompt */
  prompt: string;
  /** Category */
  category: string;
  /** Style Keywords */
  style_keywords?: string[] | null;
}

/** AdGenerationResponse */
export interface AdGenerationResponse {
  /** Image Url */
  image_url: string;
  /** Prompt Used */
  prompt_used: string;
  /** Category */
  category: string;
  /** Generation Id */
  generation_id: string;
}

/** AdminAuthRequest */
export interface AdminAuthRequest {
  /** Password */
  password: string;
}

/** AdminAuthResponse */
export interface AdminAuthResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** Body_add_laser_eyes */
export interface BodyAddLaserEyes {
  /**
   * Image
   * @format binary
   */
  image: File;
}

/** Body_add_template */
export interface BodyAddTemplate {
  /** Name */
  name: string;
  /** Description */
  description: string;
  /**
   * Image
   * @format binary
   */
  image: File;
  /** Template Id */
  template_id?: string | null;
  /** Prompt */
  prompt?: string | null;
  /** Password */
  password: string;
}

/** Body_transform_image */
export interface BodyTransformImage {
  /**
   * User Image
   * @format binary
   */
  user_image: File;
  /** Template Id */
  template_id: string;
  /** Custom Prompt */
  custom_prompt?: string | null;
  /**
   * Generate Caption
   * @default false
   */
  generate_caption?: boolean | null;
  /**
   * Use Ai Transform
   * @default true
   */
  use_ai_transform?: boolean | null;
}

/** Body_transform_image_with_gemini_api */
export interface BodyTransformImageWithGeminiApi {
  /**
   * User Image
   * @format binary
   */
  user_image: File;
  /** Template Id */
  template_id: string;
}

/** Body_transform_meme_image */
export interface BodyTransformMemeImage {
  /**
   * User Image
   * @format binary
   */
  user_image: File;
  /** Template Id */
  template_id: string;
}

/** Body_update_template */
export interface BodyUpdateTemplate {
  /** Name */
  name?: string | null;
  /** Description */
  description?: string | null;
  /** Image */
  image?: File | null;
  /** Prompt */
  prompt?: string | null;
  /** Password */
  password: string;
}

/** ClearShowcaseResponse */
export interface ClearShowcaseResponse {
  /**
   * Success
   * Whether the operation was successful
   */
  success: boolean;
  /**
   * Message
   * Message describing the result
   */
  message: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** ImageGenerationRequest */
export interface ImageGenerationRequest {
  /** Template Id */
  template_id: string;
  /** Image Data */
  image_data: string;
}

/** ImageGenerationResponse */
export interface ImageGenerationResponse {
  /** Transformed Image */
  transformed_image: string;
  /** Model Used */
  model_used: string;
}

/**
 * MemeGenerationRequest
 * Request model for generating meme text with GPT-4o
 */
export interface MemeGenerationRequest {
  /** Template Id */
  template_id: string;
  /** Prompt */
  prompt?: string | null;
  /**
   * Style
   * @default "funny"
   */
  style?: string | null;
  /** Context */
  context?: Record<string, any> | null;
}

/**
 * MemeGenerationResponse
 * Response model for meme text generation
 */
export interface MemeGenerationResponse {
  /** Caption */
  caption: string;
  /**
   * Alternative Captions
   * @default []
   */
  alternative_captions?: string[];
  /**
   * Model Used
   * @default "gpt-4o"
   */
  model_used?: string;
}

/** MotionVideoCallbackResponse */
export interface MotionVideoCallbackResponse {
  /** Video Id */
  video_id: string;
  /** Status */
  status: string;
  /** Video Url */
  video_url?: string | null;
  /** Error */
  error?: string | null;
}

/** MotionVideoRequest */
export interface MotionVideoRequest {
  /** Image Url */
  image_url: string;
  /** Prompt */
  prompt?: string | null;
  /** Negative Prompt */
  negative_prompt?: string | null;
  /**
   * Video Length
   * @default 24
   */
  video_length?: number | null;
  /** Seed */
  seed?: number | null;
  /**
   * Steps
   * @default 25
   */
  steps?: number | null;
  /**
   * Cfg
   * @default 7
   */
  cfg?: number | null;
  /**
   * Frame Rate
   * @default 24
   */
  frame_rate?: number | null;
}

/** MotionVideoResponse */
export interface MotionVideoResponse {
  /** Video Id */
  video_id: string;
  /** Status */
  status: string;
  /** Message */
  message: string;
}

/** ShowcaseItem */
export interface ShowcaseItem {
  /**
   * Id
   * Unique ID for the showcase item
   */
  id: string;
  /**
   * Timestamp
   * ISO timestamp of when the transformation was created
   */
  timestamp: string;
  /**
   * Template Id
   * ID of the template used
   */
  template_id: string;
  /**
   * Template Name
   * Name of the template used
   */
  template_name: string;
  /**
   * Template Description
   * Description of the template
   */
  template_description: string;
  /**
   * Template Url
   * URL to the original template image
   */
  template_url: string;
  /**
   * Result Url
   * URL to the transformed image
   */
  result_url: string;
  /**
   * Likes
   * Number of likes for this transformation
   * @default 0
   */
  likes?: number;
  /**
   * Username
   * Username of the creator (if available)
   */
  username?: string | null;
  /**
   * Caption
   * Optional caption for the transformation
   */
  caption?: string | null;
}

/** ShowcaseResponse */
export interface ShowcaseResponse {
  /**
   * Items
   * List of showcase items
   */
  items: ShowcaseItem[];
  /**
   * Total
   * Total number of showcase items available
   */
  total: number;
}

/** TrackEventRequest */
export interface TrackEventRequest {
  /** Event Type */
  event_type: string;
  /** Template Id */
  template_id?: string | null;
  /** Session Id */
  session_id: string;
  /** Meta */
  meta?: Record<string, any> | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** TrackEventResponse */
export interface AppApisAnalyticsTrackEventResponse {
  /** Success */
  success: boolean;
  /** Event Id */
  event_id: string;
}

/** TrackEventResponse */
export interface AppApisConsolidatedTrackEventResponse {
  /** Success */
  success: boolean;
  /** Event Id */
  event_id?: string | null;
  /** Error */
  error?: string | null;
}

/** TrackEventResponse */
export interface TrackEventResponse {
  /** Success */
  success: boolean;
  /** Event Id */
  event_id: string;
}

export type CheckHealthData = HealthResponse;

export type TrackEventData = AppApisAnalyticsTrackEventResponse;

export type TrackEventError = HTTPValidationError;

export interface AdminAuthParams {
  /** Password */
  password: string;
}

export type AdminAuthData = AdminAuthResponse;

export type AdminAuthError = HTTPValidationError;

export interface GetAnalyticsDataParams {
  /** Password */
  password: string;
}

/** Response Get Analytics Data */
export type GetAnalyticsDataData = Record<string, any>;

export type GetAnalyticsDataError = HTTPValidationError;

export type GetTemplatesPublicData = any;

export interface AddLaserEyesParams {
  /**
   * Intensity
   * @exclusiveMin 0
   * @max 1.5
   * @default 1
   */
  intensity?: number;
}

export type AddLaserEyesData = any;

export type AddLaserEyesError = HTTPValidationError;

export type GenerateMotionVideoData = MotionVideoResponse;

export type GenerateMotionVideoError = HTTPValidationError;

export interface GetMotionVideoStatusParams {
  /** Video Id */
  videoId: string;
}

export type GetMotionVideoStatusData = MotionVideoCallbackResponse;

export type GetMotionVideoStatusError = HTTPValidationError;

export interface DownloadMotionVideoParams {
  /** Video Id */
  videoId: string;
}

export type DownloadMotionVideoData = any;

export type DownloadMotionVideoError = HTTPValidationError;

export type GetAdCategoriesData = any;

export type GenerateAdData = AdGenerationResponse;

export type GenerateAdError = HTTPValidationError;

export type GenerateViralMemeData = ImageGenerationResponse;

export type GenerateViralMemeError = HTTPValidationError;

export interface GetModelAnalyticsParams {
  /** Password */
  password: string;
}

export type GetModelAnalyticsData = any;

export type GetModelAnalyticsError = HTTPValidationError;

export type GenerateMemeTextData = MemeGenerationResponse;

export type GenerateMemeTextError = HTTPValidationError;

export interface GetShowcaseParams {
  /**
   * Limit
   * Number of items to return
   * @min 1
   * @max 50
   * @default 10
   */
  limit?: number;
  /**
   * Offset
   * Offset for pagination
   * @min 0
   * @default 0
   */
  offset?: number;
}

export type GetShowcaseData = ShowcaseResponse;

export type GetShowcaseError = HTTPValidationError;

export interface LikeShowcaseItemParams {
  /** Item Id */
  itemId: string;
}

export type LikeShowcaseItemData = any;

export type LikeShowcaseItemError = HTTPValidationError;

export type ClearShowcaseData = ClearShowcaseResponse;

export type GetTemplatesData = any;

export type TransformImageData = any;

export type TransformImageError = HTTPValidationError;

export type GetFaceswapAnalyticsData = any;

/** Event Data */
export type TrackFaceswapEventPayload = Record<string, any>;

export type TrackFaceswapEventData = any;

export type TrackFaceswapEventError = HTTPValidationError;

export type GetTemplatesPublic2Data = any;

export interface ListTemplatesParams {
  /** Password */
  password: string;
}

export type ListTemplatesData = any;

export type ListTemplatesError = HTTPValidationError;

export type AddTemplateData = any;

export type AddTemplateError = HTTPValidationError;

export interface UpdateTemplateParams {
  /** Template Id */
  templateId: string;
}

export type UpdateTemplateData = any;

export type UpdateTemplateError = HTTPValidationError;

export interface DeleteTemplateParams {
  /** Password */
  password: string;
  /** Template Id */
  templateId: string;
}

export type DeleteTemplateData = any;

export type DeleteTemplateError = HTTPValidationError;

export type TransformImageWithGeminiApiData = any;

export type TransformImageWithGeminiApiError = HTTPValidationError;

export type GetGeminiTemplatesData = any;

export type TransformMemeImageData = any;

export type TransformMemeImageError = HTTPValidationError;

export type GetMemeGeneratorTemplatesData = any;

export type AdminAuth2Data = AdminAuthResponse;

export type AdminAuth2Error = HTTPValidationError;

export type TrackEvent2Data = AppApisConsolidatedTrackEventResponse;

export type TrackEvent2Error = HTTPValidationError;

export interface GetAnalyticsData2Params {
  /** Password */
  password: string;
}

/** Response Get Analytics Data */
export type GetAnalyticsData2Data = Record<string, any>;

export type GetAnalyticsData2Error = HTTPValidationError;
