import {
  AdGenerationRequest,
  AddLaserEyesData,
  AddTemplateData,
  AdminAuth2Data,
  AdminAuthData,
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
  DownloadMotionVideoData,
  GenerateAdData,
  GenerateMemeTextData,
  GenerateMotionVideoData,
  GenerateViralMemeData,
  GetAdCategoriesData,
  GetAnalyticsData2Data,
  GetAnalyticsDataData,
  GetFaceswapAnalyticsData,
  GetGeminiTemplatesData,
  GetMemeGeneratorTemplatesData,
  GetModelAnalyticsData,
  GetMotionVideoStatusData,
  GetShowcaseData,
  GetTemplatesData,
  GetTemplatesPublic2Data,
  GetTemplatesPublicData,
  ImageGenerationRequest,
  LikeShowcaseItemData,
  ListTemplatesData,
  MemeGenerationRequest,
  MotionVideoRequest,
  TrackEvent2Data,
  TrackEventData,
  TrackEventRequest,
  TrackFaceswapEventData,
  TrackFaceswapEventPayload,
  TransformImageData,
  TransformImageWithGeminiApiData,
  TransformMemeImageData,
  UpdateTemplateData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Track a user interaction event
   * @tags dbtn/module:analytics
   * @name track_event
   * @summary Track Event
   * @request POST:/routes/track
   */
  export namespace track_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrackEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TrackEventData;
  }

  /**
   * @description Simple authentication for admin dashboard
   * @tags dbtn/module:analytics
   * @name admin_auth
   * @summary Admin Auth
   * @request GET:/routes/admin/auth
   */
  export namespace admin_auth {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AdminAuthData;
  }

  /**
   * @description Get aggregated analytics data for the admin dashboard
   * @tags dbtn/module:analytics
   * @name get_analytics_data
   * @summary Get Analytics Data
   * @request GET:/routes/admin/data
   */
  export namespace get_analytics_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAnalyticsDataData;
  }

  /**
   * @description Get available meme templates - publicly accessible endpoint Note: This endpoint is deprecated. Please use /faceswap/templates/public instead.
   * @tags dbtn/module:public
   * @name get_templates_public
   * @summary Get Templates Public
   * @request GET:/routes/public/faceswap/templates
   */
  export namespace get_templates_public {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplatesPublicData;
  }

  /**
   * @description Add laser eyes to an uploaded image. Parameters: - image: User uploaded image - intensity: Intensity of the laser effect (0.1-1.5) Returns: - The processed image with laser eyes
   * @tags dbtn/module:laser_eyes
   * @name add_laser_eyes
   * @summary Add Laser Eyes
   * @request POST:/routes/laser-eyes/add
   */
  export namespace add_laser_eyes {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Intensity
       * @exclusiveMin 0
       * @max 1.5
       * @default 1
       */
      intensity?: number;
    };
    export type RequestBody = BodyAddLaserEyes;
    export type RequestHeaders = {};
    export type ResponseBody = AddLaserEyesData;
  }

  /**
   * No description
   * @tags dbtn/module:motion_video
   * @name generate_motion_video
   * @summary Generate Motion Video
   * @request POST:/routes/generate-motion-video
   */
  export namespace generate_motion_video {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MotionVideoRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateMotionVideoData;
  }

  /**
   * No description
   * @tags dbtn/module:motion_video
   * @name get_motion_video_status
   * @summary Get Motion Video Status
   * @request GET:/routes/motion-video/{video_id}/status
   */
  export namespace get_motion_video_status {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMotionVideoStatusData;
  }

  /**
   * No description
   * @tags dbtn/module:motion_video
   * @name download_motion_video
   * @summary Download Motion Video
   * @request GET:/routes/motion-video/{video_id}/download
   */
  export namespace download_motion_video {
    export type RequestParams = {
      /** Video Id */
      videoId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DownloadMotionVideoData;
  }

  /**
   * @description Get available ad categories
   * @tags dbtn/module:viral_ads
   * @name get_ad_categories
   * @summary Get Ad Categories
   * @request GET:/routes/viral-ads/categories
   */
  export namespace get_ad_categories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAdCategoriesData;
  }

  /**
   * @description Generate a viral advertisement based on the provided prompt and category
   * @tags dbtn/module:viral_ads
   * @name generate_ad
   * @summary Generate Ad
   * @request POST:/routes/viral-ads/generate
   */
  export namespace generate_ad {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAdData;
  }

  /**
   * @description Generate a viral meme from an uploaded image
   * @tags dbtn/module:image_generation
   * @name generate_viral_meme
   * @summary Generate Viral Meme
   * @request POST:/routes/image-generation/generate
   */
  export namespace generate_viral_meme {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ImageGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateViralMemeData;
  }

  /**
   * @description Get analytics data for AI model usage This endpoint returns usage statistics for the different OpenAI models.
   * @tags dbtn/module:openai
   * @name get_model_analytics
   * @summary Get Model Analytics
   * @request GET:/routes/openai/model-analytics
   */
  export namespace get_model_analytics {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetModelAnalyticsData;
  }

  /**
   * @description Generate meme text/captions using GPT-4o This endpoint uses OpenAI's GPT-4o to generate creative and funny meme captions based on the selected template and optional context. Args: request: The meme generation request containing template and context Returns: Meme caption text and alternatives
   * @tags dbtn/module:openai
   * @name generate_meme_text
   * @summary Generate Meme Text
   * @request POST:/routes/openai/generate-meme-text
   */
  export namespace generate_meme_text {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MemeGenerationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateMemeTextData;
  }

  /**
   * @description Get public showcase of transformations
   * @tags dbtn/module:showcase
   * @name get_showcase
   * @summary Get Showcase
   * @request GET:/routes/showcase/
   */
  export namespace get_showcase {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetShowcaseData;
  }

  /**
   * @description Add a like to a showcase item
   * @tags dbtn/module:showcase
   * @name like_showcase_item
   * @summary Like Showcase Item
   * @request POST:/routes/showcase/like/{item_id}
   */
  export namespace like_showcase_item {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LikeShowcaseItemData;
  }

  /**
   * @description Clear all transformations from the showcase
   * @tags dbtn/module:showcase
   * @name clear_showcase
   * @summary Clear Showcase
   * @request POST:/routes/showcase/clear
   */
  export namespace clear_showcase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ClearShowcaseData;
  }

  /**
   * @description Get available meme templates
   * @tags dbtn/module:faceswap
   * @name get_templates
   * @summary Get Templates
   * @request GET:/routes/faceswap/templates
   */
  export namespace get_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplatesData;
  }

  /**
   * @description Transform user image using specified meme template This endpoint takes a user's face photo and transforms it using a selected meme template. It preserves the user's facial features while applying the style of the meme template. Args: user_image: The user's face photo to transform template_id: The ID of the meme template to use custom_prompt: Optional custom prompt for transformation guidance generate_caption: Whether to generate a caption for the meme use_ai_transform: Whether to use GPT-4o Vision (True) or OpenCV (False) Returns: A PNG image of the transformed photo Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   * @tags dbtn/module:faceswap
   * @name transform_image
   * @summary Transform Image
   * @request POST:/routes/faceswap/transform
   */
  export namespace transform_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyTransformImage;
    export type RequestHeaders = {};
    export type ResponseBody = TransformImageData;
  }

  /**
   * @description Get analytics data for admin dashboard This endpoint returns usage statistics for the FaceSwap API. It shows which templates are popular and any errors that users encountered.
   * @tags dbtn/module:faceswap
   * @name get_faceswap_analytics
   * @summary Get Faceswap Analytics
   * @request GET:/routes/faceswap/analytics
   */
  export namespace get_faceswap_analytics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFaceswapAnalyticsData;
  }

  /**
   * @description Track custom events This endpoint allows tracking custom events like page views or button clicks.
   * @tags dbtn/module:faceswap
   * @name track_faceswap_event
   * @summary Track Faceswap Event
   * @request POST:/routes/faceswap/track_event
   */
  export namespace track_faceswap_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrackFaceswapEventPayload;
    export type RequestHeaders = {};
    export type ResponseBody = TrackFaceswapEventData;
  }

  /**
   * @description Get available meme templates - publicly accessible endpoint
   * @tags dbtn/module:faceswap
   * @name get_templates_public2
   * @summary Get Templates Public2
   * @request GET:/routes/faceswap/templates/public
   */
  export namespace get_templates_public2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTemplatesPublic2Data;
  }

  /**
   * @description List all templates in the system
   * @tags dbtn/module:templates
   * @name list_templates
   * @summary List Templates
   * @request GET:/routes/templates/list
   */
  export namespace list_templates {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTemplatesData;
  }

  /**
   * @description Add a new template to the system
   * @tags dbtn/module:templates
   * @name add_template
   * @summary Add Template
   * @request POST:/routes/templates/add
   */
  export namespace add_template {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyAddTemplate;
    export type RequestHeaders = {};
    export type ResponseBody = AddTemplateData;
  }

  /**
   * @description Update an existing template
   * @tags dbtn/module:templates
   * @name update_template
   * @summary Update Template
   * @request PUT:/routes/templates/update/{template_id}
   */
  export namespace update_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = BodyUpdateTemplate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTemplateData;
  }

  /**
   * @description Delete a template
   * @tags dbtn/module:templates
   * @name delete_template
   * @summary Delete Template
   * @request DELETE:/routes/templates/delete/{template_id}
   */
  export namespace delete_template {
    export type RequestParams = {
      /** Template Id */
      templateId: string;
    };
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTemplateData;
  }

  /**
   * @description Transform user image using specified template with Gemini API This endpoint takes a user's photo and transforms it using Gemini's image generation capabilities. It uses the template's prompt to guide the transformation, creating a meme-style image. Args: user_image: The user's photo to transform template_id: The ID of the meme template to use Returns: The transformed image as a PNG Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   * @tags dbtn/module:gemini_transform
   * @name transform_image_with_gemini_api
   * @summary Transform Image With Gemini Api
   * @request POST:/routes/gemini-transform/transform-with-gemini
   */
  export namespace transform_image_with_gemini_api {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyTransformImageWithGeminiApi;
    export type RequestHeaders = {};
    export type ResponseBody = TransformImageWithGeminiApiData;
  }

  /**
   * @description Get available meme templates for the frontend
   * @tags dbtn/module:gemini_transform
   * @name get_gemini_templates
   * @summary Get Gemini Templates
   * @request GET:/routes/gemini-transform/gemini-templates
   */
  export namespace get_gemini_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGeminiTemplatesData;
  }

  /**
   * @description Transform user image using specified template with Gemini API This endpoint takes a user's photo and transforms it using Gemini's image generation capabilities. It uses the template's prompt to guide the transformation, creating a meme-style image. Args: user_image: The user's photo to transform template_id: The ID of the meme template to use Returns: The transformed image as a PNG Raises: 400: Invalid image or template 404: Template not found 500: Processing error
   * @tags dbtn/module:meme_generator
   * @name transform_meme_image
   * @summary Transform Meme Image
   * @request POST:/routes/meme-generator/transform
   */
  export namespace transform_meme_image {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyTransformMemeImage;
    export type RequestHeaders = {};
    export type ResponseBody = TransformMemeImageData;
  }

  /**
   * @description Get available meme templates for the frontend
   * @tags dbtn/module:meme_generator
   * @name get_meme_generator_templates
   * @summary Get Meme Generator Templates
   * @request GET:/routes/meme-generator/meme-templates
   */
  export namespace get_meme_generator_templates {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMemeGeneratorTemplatesData;
  }

  /**
   * @description Authenticate admin user This endpoint validates the admin password.
   * @tags dbtn/module:consolidated
   * @name admin_auth2
   * @summary Admin Auth
   * @request POST:/routes/auth
   * @originalName admin_auth
   * @duplicate
   */
  export namespace admin_auth2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdminAuthRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AdminAuth2Data;
  }

  /**
   * @description Track custom events This endpoint allows tracking custom events like page views or button clicks.
   * @tags dbtn/module:consolidated
   * @name track_event2
   * @summary Track Event
   * @request POST:/routes/track_event
   * @originalName track_event
   * @duplicate
   */
  export namespace track_event2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrackEventRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TrackEvent2Data;
  }

  /**
   * @description Get analytics data for admin dashboard This endpoint returns usage statistics for all template transformations, user activity metrics, and template popularity.
   * @tags dbtn/module:consolidated
   * @name get_analytics_data2
   * @summary Get Analytics Data
   * @request GET:/routes/data
   * @originalName get_analytics_data
   * @duplicate
   */
  export namespace get_analytics_data2 {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Password */
      password: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAnalyticsData2Data;
  }
}
