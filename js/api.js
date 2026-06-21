// js/api.js

// ===== PRODUCTION (Render) =====
const API_CONFIG = {
    BASE_URL: "https://mycampus-cafe-slim-api-1.onrender.com/api"
};

// ===== DEVELOPMENT (local) – comment out when deploying =====
// const API_CONFIG = {
//     BASE_URL: "http://localhost/mycampus-cafe-slim-api/public/api"
// };

function getToken() {
    return localStorage.getItem("mycampus_token");
}

function setToken(token) {
    localStorage.setItem("mycampus_token", token);
}

function clearToken() {
    localStorage.removeItem("mycampus_token");
}

function authHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function publicHeaders() {
    return {
        "Content-Type": "application/json"
    };
}

function handleApiError(response, result) {
    if (response.status === 401) return "Unauthorized access. Please login again.";
    if (response.status === 403) return "You are not allowed to perform this operation.";
    if (response.status === 404) return "Requested record was not found.";
    if (response.status >= 500) return "Server error. Please contact administrator.";
    return result.message || "Unexpected error occurred.";
}
