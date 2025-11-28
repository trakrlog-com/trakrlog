import { Request, Response } from "express";

export type ApiResponseCode = {
    message: string;
    statusCode: number;
    description?: string;
};

export type ApiResponseCodesType = {
    GenericError: ApiResponseCode;
    ConditionNotFound: ApiResponseCode;
    SegmentNotFound: ApiResponseCode;
    RuleNotFound: ApiResponseCode;
    FlagNotFound: ApiResponseCode;
    NoMatchingCondition: ApiResponseCode;
    ApiKeyNotValid: ApiResponseCode;
    ApiKeyNotFound: ApiResponseCode;
    ApiKeyExpired: ApiResponseCode;
    FlagDisabled: ApiResponseCode;
    FlagMatch: ApiResponseCode;
    InputMissing: ApiResponseCode;
    SdkAuthKeyNotFound: ApiResponseCode;
    UserAuthFailed: ApiResponseCode;
    Success: ApiResponseCode;
};

export const ApiResponseCodes: ApiResponseCodesType = {
    GenericError: { message: "generic_error", statusCode: 500 },

    ConditionNotFound: { message: "condition_not_found", statusCode: 404 },
    FlagNotFound: { message: "flag_not_found", statusCode: 404 },
    SegmentNotFound: { message: "segment_not_found", statusCode: 404 },
    RuleNotFound: { message: "rule_not_found", statusCode: 404 },

    NoMatchingCondition: { message: "no_matching_condition", statusCode: 400 },
    InputMissing: { message: "input_missing", statusCode: 400 },

    ApiKeyNotValid: { message: "api_key_not_valid", statusCode: 401 },
    ApiKeyExpired: { message: "api_key_expired", statusCode: 401 },
    ApiKeyNotFound: {
        message: "api_key_not_found",
        statusCode: 401,
        description:
            "Add the 'tl-api-key' header with your api key to the request",
    },

    SdkAuthKeyNotFound: { message: "sdkauth_key_not_found", statusCode: 404 },

    UserAuthFailed: { message: "user_auth_failed", statusCode: 401 },

    FlagDisabled: { message: "flag_disabled", statusCode: 200 },
    FlagMatch: { message: "flag_match", statusCode: 200 },

    Success: { message: "generic_success", statusCode: 200 },
} as const;




export type ResponseModel<T extends object | null> = {
    success: boolean;
    error?: ApiResponseCode;
    data: T;
    user?: unknown;
    cookies?: unknown;
};

export const setErrorResponse = (resp: Response, error: ApiResponseCode) => {
    resp.status(error.statusCode).json({
        success: false,
        error: error,
        data: null,
    } as ResponseModel<null>);
};

export const setSuccessResponse = <T extends object | null>(
    resp: Response,
    code: ApiResponseCode,
    data: T,
    req?: Request,
) => {
    const response = {
        success: true,
        data,
    } as ResponseModel<T>;

    if (req) {
        response.user = req.user;
        response.cookies = req.cookies;
    }

    resp.status(code.statusCode).json(response);
};