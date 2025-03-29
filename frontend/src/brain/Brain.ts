import {
  AdGenerationRequest,
  AddLaserEyesData,
  AddLaserEyesError,
  AddLaserEyesParams,
  AddTemplateData,
  AddTemplateError,
  AdminAuth2Data,
  AdminAuth2Error,
  AdminAuthData,
  AdminAuthError,
  AdminAuthParams,
  AdminAuthRequest,
  BodyAddLaserEyes,
  BodyAddTemplate,
  BodyTransformImage,
  BodyTransformImageWithGeminiApi,
  BodyTransformMemeImage,
  BodyUpdateTemplate,
  CheckHealthData,
  ClearShowcaseData,
  DeleteTemplateData,
  DeleteTemplateError,
  DeleteTemplateParams,
  DownloadMotionVideoData,
  DownloadMotionVideoError,
  DownloadMotionVideoParams,
  GenerateAdData,
  GenerateAdError,
  GenerateMemeTextData,
  GenerateMemeTextError,
  GenerateMotionVideoData,
  GenerateMotionVideoError,
  GenerateViralMemeData,
  GenerateViralMemeError,
  GetAdCategoriesData,
  GetAnalyticsData2Data,
  GetAnalyticsData2Error,
  GetAnalyticsData2Params,
  GetAnalyticsDataData,
  GetAnalyticsDataError,
  GetAnalyticsDataParams,
  GetFaceswapAnalyticsData,
  GetGeminiTemplatesData,
  GetMemeGeneratorTemplatesData,
  GetModelAnalyticsData,
  GetModelAnalyticsError,
  GetModelAnalyticsParams,
  GetMotionVideoStatusData,
  GetMotionVideoStatusError,
  GetMotionVideoStatusParams,
  GetShowcaseData,
  GetShowcaseError,
  GetShowcaseParams,
  GetTemplatesData,
  GetTemplatesPublic2Data,
  GetTemplatesPublicData,
  ImageGenerationRequest,
  LikeShowcaseItemData,
  LikeShowcaseItemError,
  LikeShowcaseItemParams,
  ListTemplatesData,
  ListTemplatesError,
  ListTemplatesParams,
  MemeGenerationRequest,
  MotionVideoRequest,
  TrackEvent2Data,
  TrackEvent2Error,
  TrackEventData,
  TrackEventError,
  TrackEventRequest,
  TrackFaceswapEventData,
  TrackFaceswapEventError,
  TrackFaceswapEventPayload,
  TransformImageData,
  TransformImageError,
  TransformImageWithGeminiApiData,
  TransformImageWithGeminiApiError,
  TransformMemeImageData,
  TransformMemeImageError,
  UpdateTemplateData,
  UpdateTemplateError,
  UpdateTemplateParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track a user interaction event
   *
   * @tags dbtn/module:analytics
   * @name track_event
   * @summary Track Event
   * @request POST:/routes/track
   */
  track_event = (data: TrackEventRequest, params: RequestParams = {}) =>
    this.request<TrackEventData, TrackEventError>({
      path: `/routes/track`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Simple authentication for admin dashboard
   *
   * @tags dbtn/module:analytics
   * @name admin_auth
   * @summary Admin Auth
   * @request GET:/routes/admin/auth
   */
  admin_auth = (query: AdminAuthParams, params: RequestParams = {}) =>
    this.request<AdminAuthData, AdminAuthError>({
      path: `/routes/admin/auth`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get aggregated analytics data for the admin dashboard
   *
   * @tags dbtn/module:analytics
   * @name get_analytics_data
   * @summary Get Analytics Data
   * @request GET:/routes/admin/data
   */
  get_analytics_data = (query: GetAnalyticsDataParams, params: RequestParams = {}) =>
    this.request<GetAnalyticsDataData, GetAnalyticsDataError>({
      path: `/routes/admin/data`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get available meme templates - publicly accessible endpoint Note: This endpoint is deprecated. Please use /faceswap/templates/public instead.
   *
   * @tags dbtn/module:public
   * @name get_templates_public
   * @summary Get Templates Public
   * @request GET:/routes/public/faceswap/templates
   */
  get_templates_public = (params: RequestParams = {}) =>
    this.request<GetTemplatesPublicData, any>({
      path: `/routes/public/faceswap/templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add laser eyes to an uploaded image. Parameters: - image: User uploaded image - intensity: Intensity of the laser effect (0.1-1.5) Returns: - The processed image with laser eyes
   *
   * @tags dbtn/module:laser_eyes
   * @name add_laser_eyes
   * @summary Add Laser Eyes
   * @request POST:/routes/laser-eyes/add
   */
  add_laser_eyes = (query: AddLaserEyesParams, data: BodyAddLaserEyes, params: RequestParams = {}) =>
    this.request<AddLaserEyesData, AddLaserEyesError>({
      path: `/routes/laser-eyes/add`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:motion_video
   * @name generate_motion_video
   * @summary Generate Motion Video
   * @request POST:/routes/generate-motion-video
   */
  generate_motion_video = (data: MotionVideoRequest, params: RequestParams = {}) =>
    this.request<GenerateMotionVideoData, GenerateMotionVideoError>({
      path: `/routes/generate-motion-video`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:motion_video
   * @name get_motion_video_status
   * @summary Get Motion Video Status
   * @request GET:/routes/motion-video/{video_id}/status
   */
  get_motion_video_status = ({ videoId, ...query }: GetMotionVideoStatusParams, params: RequestParams = {}) =>
    this.request<GetMotionVideoStatusData, GetMotionVideoStatusError>({
      path: `/routes/motion-video/${videoId}/status`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:motion_video
   * @name download_motion_video
   * @summary Download Motion Video
   * @request GET:/routes/motion-video/{video_id}/download
   */
  download_motion_video = ({ videoId, ...query }: DownloadMotionVideoParams, params: RequestParams = {}) =>
    this.request<DownloadMotionVideoData, DownloadMotionVideoError>({
      path: `/routes/motion-video/${videoId}/download`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get available ad categories
   *
   * @tags dbtn/module:viral_ads
   * @name get_ad_categories
   * @summary Get Ad Categories
   * @request GET:/routes/viral-ads/categories
   */
  get_ad_categories = (params: RequestParams = {}) =>
    this.request<GetAdCategoriesData, any>({
      path: `/routes/viral-ads/categories`,
      method: "GET",
      ...params,
    });

  /**
   * @description Generate a viral advertisement based on the provided prompt and category
   *
   * @tags dbtn/module:viral_ads
   * @name generate_ad
   * @summary Generate Ad
   * @request POST:/routes/viral-ads/generate
   */
  generate_ad = (data: AdGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateAdData, GenerateAdError>({
      path: `/routes/viral-ads/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate a viral meme from an uploaded image
   *
   * @tags dbtn/module:image_generation
   * @name generate_viral_meme
   * @summary Generate Viral Meme
   * @request POST:/routes/image-generation/generate
   */
  generate_viral_meme = (data: ImageGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateViralMemeData, GenerateViralMemeError>({
      path: `/routes/image-generation/generate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get analytics data for AI model usage This endpoint returns usage statistics for the different OpenAI models.
   *
   * @tags dbtn/module:openai
   * @name get_model_analytics
   * @summary Get Model Analytics
   * @request GET:/routes/openai/model-analytics
   */
  get_model_analytics = (query: GetModelAnalyticsParams, params: RequestParams = {}) =>
    this.request<GetModelAnalyticsData, GetModelAnalyticsError>({
      path: `/routes/openai/model-analytics`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Generate meme text/captions using GPT-4o This endpoint uses OpenAI's GPT-4o to generate creative and funny meme captions based on the selected template and optional context. Args: request: The meme generation request containing template and context Returns: Meme caption text and alternatives
   *
   * @tags dbtn/module:openai
   * @name generate_meme_text
   * @summary Generate Meme Text
   * @request POST:/routes/openai/generate-meme-text
   */
  generate_meme_text = (data: MemeGenerationRequest, params: RequestParams = {}) =>
    this.request<GenerateMemeTextData, GenerateMemeTextError>({
      path: `/routes/openai/generate-meme-text`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get public showcase of transformations
   *
   * @tags dbtn/module:showcase
   * @name get_showcase
   * @summary Get Showcase
   * @request GET:/routes/showcase/
   */
  get_showcase = (query: GetShowcaseParams, params: RequestParams = {}) =>
    this.request<GetShowcaseData, GetShowcaseError>({
      path: `/routes/showcase/`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Add a like to a showcase item
   *
   * @tags dbtn/module:showcase
   * @name like_showcase_item
   * @summary Like Showcase Item
   * @request POST:/routes/showcase/like/{item_id}
   */
  like_showcase_item = ({ itemId, ...query }: LikeShowcaseItemParams, params: RequestParams = {}) =>
    this.request<LikeShowcaseItemData, LikeShowcaseItemError>({
      path: `/routes/showcase/like/${itemId}`,
      method: "POST",
      ...params,
    });

  /**
   * @description Clear all transformations from the showcase
   *
   * @tags dbtn/module:showcase
   * @name clear_showcase
   * @summary Clear Showcase
   * @request POST:/routes/showcase/clear
   */
  clear_showcase = (params: RequestParams = {}) =>
    this.request<ClearShowcaseData, any>({
      path: `/routes/showcase/clear`,
      method: "POST",
      ...params,
    });

  /**
   * @description Get available meme templates
   *
   * @tags dbtn/module:faceswap
   * @name get_templates
   * @summary Get Templates
   * @request GET:/routes/faceswap/templates
   */
  get_templates = (params: RequestParams = {}) =>
    this.request<GetTemplatesData, any>({
      path: `/routes/faceswap/templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Transform user image using specified meme template This endpoint takes a user's face photo and transforms it using a selected meme template. It preserves the user's facial features while applying the style of the meme template. Args: user_image: The user's face photo to transform template_id: The ID of the meme template to use custom_prompt: Optional custom prompt for transformation guidance generate_caption: Whether to generate a caption for the meme use_ai_transform: Whether to use GPT-4o Vision (True) or OpenCV (False) Returns: A PNG image of the transformed photo Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   *
   * @tags dbtn/module:faceswap
   * @name transform_image
   * @summary Transform Image
   * @request POST:/routes/faceswap/transform
   */
  transform_image = (data: BodyTransformImage, params: RequestParams = {}) =>
    this.request<TransformImageData, TransformImageError>({
      path: `/routes/faceswap/transform`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Get analytics data for admin dashboard This endpoint returns usage statistics for the FaceSwap API. It shows which templates are popular and any errors that users encountered.
   *
   * @tags dbtn/module:faceswap
   * @name get_faceswap_analytics
   * @summary Get Faceswap Analytics
   * @request GET:/routes/faceswap/analytics
   */
  get_faceswap_analytics = (params: RequestParams = {}) =>
    this.request<GetFaceswapAnalyticsData, any>({
      path: `/routes/faceswap/analytics`,
      method: "GET",
      ...params,
    });

  /**
   * @description Track custom events This endpoint allows tracking custom events like page views or button clicks.
   *
   * @tags dbtn/module:faceswap
   * @name track_faceswap_event
   * @summary Track Faceswap Event
   * @request POST:/routes/faceswap/track_event
   */
  track_faceswap_event = (data: TrackFaceswapEventPayload, params: RequestParams = {}) =>
    this.request<TrackFaceswapEventData, TrackFaceswapEventError>({
      path: `/routes/faceswap/track_event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get available meme templates - publicly accessible endpoint
   *
   * @tags dbtn/module:faceswap
   * @name get_templates_public2
   * @summary Get Templates Public2
   * @request GET:/routes/faceswap/templates/public
   */
  get_templates_public2 = (params: RequestParams = {}) =>
    this.request<GetTemplatesPublic2Data, any>({
      path: `/routes/faceswap/templates/public`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all templates in the system
   *
   * @tags dbtn/module:templates
   * @name list_templates
   * @summary List Templates
   * @request GET:/routes/templates/list
   */
  list_templates = (query: ListTemplatesParams, params: RequestParams = {}) =>
    this.request<ListTemplatesData, ListTemplatesError>({
      path: `/routes/templates/list`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Add a new template to the system
   *
   * @tags dbtn/module:templates
   * @name add_template
   * @summary Add Template
   * @request POST:/routes/templates/add
   */
  add_template = (data: BodyAddTemplate, params: RequestParams = {}) =>
    this.request<AddTemplateData, AddTemplateError>({
      path: `/routes/templates/add`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Update an existing template
   *
   * @tags dbtn/module:templates
   * @name update_template
   * @summary Update Template
   * @request PUT:/routes/templates/update/{template_id}
   */
  update_template = (
    { templateId, ...query }: UpdateTemplateParams,
    data: BodyUpdateTemplate,
    params: RequestParams = {},
  ) =>
    this.request<UpdateTemplateData, UpdateTemplateError>({
      path: `/routes/templates/update/${templateId}`,
      method: "PUT",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Delete a template
   *
   * @tags dbtn/module:templates
   * @name delete_template
   * @summary Delete Template
   * @request DELETE:/routes/templates/delete/{template_id}
   */
  delete_template = ({ templateId, ...query }: DeleteTemplateParams, params: RequestParams = {}) =>
    this.request<DeleteTemplateData, DeleteTemplateError>({
      path: `/routes/templates/delete/${templateId}`,
      method: "DELETE",
      query: query,
      ...params,
    });

  /**
   * @description Transform user image using specified template with Gemini API This endpoint takes a user's photo and transforms it using Gemini's image generation capabilities. It uses the template's prompt to guide the transformation, creating a meme-style image. Args: user_image: The user's photo to transform template_id: The ID of the meme template to use Returns: The transformed image as a PNG Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   *
   * @tags dbtn/module:gemini_transform
   * @name transform_image_with_gemini_api
   * @summary Transform Image With Gemini Api
   * @request POST:/routes/gemini-transform/transform-with-gemini
   */
  transform_image_with_gemini_api = (data: BodyTransformImageWithGeminiApi, params: RequestParams = {}) =>
    this.request<TransformImageWithGeminiApiData, TransformImageWithGeminiApiError>({
      path: `/routes/gemini-transform/transform-with-gemini`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Get available meme templates for the frontend
   *
   * @tags dbtn/module:gemini_transform
   * @name get_gemini_templates
   * @summary Get Gemini Templates
   * @request GET:/routes/gemini-transform/gemini-templates
   */
  get_gemini_templates = (params: RequestParams = {}) =>
    this.request<GetGeminiTemplatesData, any>({
      path: `/routes/gemini-transform/gemini-templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Transform user image using specified template with Gemini API This endpoint takes a user's photo and transforms it using Gemini's image generation capabilities. It uses the template's prompt to guide the transformation, creating a meme-style image. Args: user_image: The user's photo to transform template_id: The ID of the meme template to use Returns: The transformed image as a PNG Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   *
   * @tags dbtn/module:meme_generator
   * @name transform_meme_image
   * @summary Transform Meme Image
   * @request POST:/routes/meme-generator/transform
   */
  transform_meme_image = (data: BodyTransformMemeImage, params: RequestParams = {}) =>
    this.request<TransformMemeImageData, TransformMemeImageError>({
      path: `/routes/meme-generator/transform`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Get available meme templates for the frontend
   *
   * @tags dbtn/module:meme_generator
   * @name get_meme_generator_templates
   * @summary Get Meme Generator Templates
   * @request GET:/routes/meme-generator/meme-templates
   */
  get_meme_generator_templates = (params: RequestParams = {}) =>
    this.request<GetMemeGeneratorTemplatesData, any>({
      path: `/routes/meme-generator/meme-templates`,
      method: "GET",
      ...params,
    });

  /**
   * @description Authenticate admin user This endpoint validates the admin password.
   *
   * @tags dbtn/module:consolidated
   * @name admin_auth2
   * @summary Admin Auth
   * @request POST:/routes/auth
   * @originalName admin_auth
   * @duplicate
   */
  admin_auth2 = (data: AdminAuthRequest, params: RequestParams = {}) =>
    this.request<AdminAuth2Data, AdminAuth2Error>({
      path: `/routes/auth`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Track custom events This endpoint allows tracking custom events like page views or button clicks.
   *
   * @tags dbtn/module:consolidated
   * @name track_event2
   * @summary Track Event
   * @request POST:/routes/track_event
   * @originalName track_event
   * @duplicate
   */
  track_event2 = (data: TrackEventRequest, params: RequestParams = {}) =>
    this.request<TrackEvent2Data, TrackEvent2Error>({
      path: `/routes/track_event`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get analytics data for admin dashboard This endpoint returns usage statistics for all template transformations, user activity metrics, and template popularity.
   *
   * @tags dbtn/module:consolidated
   * @name get_analytics_data2
   * @summary Get Analytics Data
   * @request GET:/routes/data
   * @originalName get_analytics_data
   * @duplicate
   */
  get_analytics_data2 = (query: GetAnalyticsData2Params, params: RequestParams = {}) =>
    this.request<GetAnalyticsData2Data, GetAnalyticsData2Error>({
      path: `/routes/data`,
      method: "GET",
      query: query,
      ...params,
    });
}
