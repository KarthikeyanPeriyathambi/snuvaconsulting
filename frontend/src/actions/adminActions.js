import axios from 'axios';
import {
    ADMIN_DASHBOARD_REQUEST,
    ADMIN_DASHBOARD_SUCCESS,
    ADMIN_DASHBOARD_FAIL,
    ADMIN_JOBS_REQUEST,
    ADMIN_JOBS_SUCCESS,
    ADMIN_JOBS_FAIL,
    ADMIN_COMPANY_PROFILE_UPDATE_REQUEST,
    ADMIN_COMPANY_PROFILE_UPDATE_SUCCESS,
    ADMIN_COMPANY_PROFILE_UPDATE_FAIL,
} from '../constants/adminConstants';
import { API_URL } from '../config';

// Get admin dashboard stats
export const getAdminDashboardStats = () => async (dispatch, getState) => {
    try {
        dispatch({ type: ADMIN_DASHBOARD_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.get(`${API_URL}/api/admin/dashboard`, config);

        dispatch({
            type: ADMIN_DASHBOARD_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: ADMIN_DASHBOARD_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Get all jobs for the logged in company admin
export const getAdminJobs = () => async (dispatch, getState) => {
    try {
        dispatch({ type: ADMIN_JOBS_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.get(`${API_URL}/api/admin/jobs`, config);

        dispatch({
            type: ADMIN_JOBS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: ADMIN_JOBS_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

// Update company profile (for admins)
export const updateCompanyProfile = (companyData) => async (dispatch, getState) => {
    try {
        dispatch({ type: ADMIN_COMPANY_PROFILE_UPDATE_REQUEST });

        const {
            userLogin: { userInfo },
        } = getState();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await axios.put(`${API_URL}/api/users/profile`, companyData, config);

        dispatch({
            type: ADMIN_COMPANY_PROFILE_UPDATE_SUCCESS,
            payload: data,
        });

        // Also update logged in user info if name/email changed
        dispatch({
            type: 'USER_LOGIN_SUCCESS',
            payload: data,
        });

        localStorage.setItem('userInfo', JSON.stringify(data));
    } catch (error) {
        dispatch({
            type: ADMIN_COMPANY_PROFILE_UPDATE_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};
