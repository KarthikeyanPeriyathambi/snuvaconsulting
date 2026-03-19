import axios from 'axios';
import {
    RESUME_UPLOAD_REQUEST,
    RESUME_UPLOAD_SUCCESS,
    RESUME_UPLOAD_FAIL,
    RESUME_DETAILS_REQUEST,
    RESUME_DETAILS_SUCCESS,
    RESUME_DETAILS_FAIL,
    RESUME_CHATBOT_RESPONSE_REQUEST,
    RESUME_CHATBOT_RESPONSE_SUCCESS,
    RESUME_CHATBOT_RESPONSE_FAIL,
    RESUME_IMPROVE_REQUEST,
    RESUME_IMPROVE_SUCCESS,
    RESUME_IMPROVE_FAIL,
    RESUME_IMPROVE_RESET,
    RESUME_SAVE_IMPROVED_REQUEST,
    RESUME_SAVE_IMPROVED_SUCCESS,
    RESUME_SAVE_IMPROVED_FAIL,
    RESUME_SAVE_IMPROVED_RESET,
} from '../constants/resumeConstants';
import { API_URL } from '../config';

// Upload resume
export const uploadResume = (formData) => async (dispatch, getState) => {
    try {
        dispatch({ type: RESUME_UPLOAD_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        // Build headers — auth is optional (backend uses optionalProtect)
        const headers = {
            'Content-Type': 'multipart/form-data',
        };
        if (userInfo && userInfo.token) {
            headers['Authorization'] = `Bearer ${userInfo.token}`;
        }

        const config = { headers };

        const { data } = await axios.post(`${API_URL}/api/resumes`, formData, config);

        dispatch({
            type: RESUME_UPLOAD_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: RESUME_UPLOAD_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Get resume details
export const getResumeDetails = (id) => async (dispatch, getState) => {
    try {
        dispatch({ type: RESUME_DETAILS_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.get(`${API_URL}/api/resumes/${id}`, config);

        dispatch({
            type: RESUME_DETAILS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: RESUME_DETAILS_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Add chatbot response to resume
export const addChatbotResponse =
    (resumeId, question, response, language) => async (dispatch, getState) => {
        try {
            dispatch({ type: RESUME_CHATBOT_RESPONSE_REQUEST });

            const {
                userLogin: { userInfo },
            } = getState();

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `${API_URL}/api/resumes/${resumeId}/responses`,
                { question, response, language },
                config
            );

            dispatch({
                type: RESUME_CHATBOT_RESPONSE_SUCCESS,
                payload: data,
            });
        } catch (error) {
            dispatch({
                type: RESUME_CHATBOT_RESPONSE_FAIL,
                payload:
                    error.response && error.response.data.message
                        ? error.response.data.message
                        : error.message,
            });
        }
    };

// Improve resume
export const improveResume = (resumeId, jobId) => async (dispatch, getState) => {
    try {
        dispatch({ type: RESUME_IMPROVE_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.post(
            `${API_URL}/api/resumes/${resumeId}/improve`,
            { jobId },
            config
        );

        dispatch({
            type: RESUME_IMPROVE_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: RESUME_IMPROVE_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Save improved resume
export const saveImprovedResume = (resumeId, improvedData) => async (dispatch, getState) => {
    try {
        dispatch({ type: RESUME_SAVE_IMPROVED_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.put(
            `${API_URL}/api/resumes/${resumeId}/improved`,
            improvedData,
            config
        );

        dispatch({
            type: RESUME_SAVE_IMPROVED_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: RESUME_SAVE_IMPROVED_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};
