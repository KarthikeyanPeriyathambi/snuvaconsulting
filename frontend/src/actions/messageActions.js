import axios from 'axios';
import {
    MESSAGE_CREATE_REQUEST,
    MESSAGE_CREATE_SUCCESS,
    MESSAGE_CREATE_FAIL,
    MESSAGE_LIST_REQUEST,
    MESSAGE_LIST_SUCCESS,
    MESSAGE_LIST_FAIL,
} from '../constants/messageConstants';
import { API_URL } from '../config';

// Send message to job applicants
export const sendMessage = (jobId, subject, content, type) => async (dispatch, getState) => {
    try {
        dispatch({ type: MESSAGE_CREATE_REQUEST });

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
            `${API_URL}/api/messages/${jobId}`,
            { subject, content, type },
            config
        );

        dispatch({
            type: MESSAGE_CREATE_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: MESSAGE_CREATE_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Get all messages for a job
export const getJobMessages = (jobId) => async (dispatch, getState) => {
    try {
        dispatch({ type: MESSAGE_LIST_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.get(`${API_URL}/api/messages/${jobId}`, config);

        dispatch({
            type: MESSAGE_LIST_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: MESSAGE_LIST_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};
