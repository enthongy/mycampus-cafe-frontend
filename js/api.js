// js/api.js

// ===== PRODUCTION (Vercel proxy) =====
const API_CONFIG = {
    BASE_URL: "/api"   // All requests go to the Vercel proxy endpoints
};

// ===== DEVELOPMENT (local) – comment out for production =====
// const API_CONFIG = {
//     BASE_URL: "http://localhost/mycampus-cafe-slim-api/public/api"
// };

// ---------- TOKEN HELPERS ----------
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
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

function publicHeaders() {
    return {
        "Content-Type": "application/json"
    };
}

// ---------- ERROR HANDLING HELPER ----------
function handleApiError(response, result) {
    if (response.status === 401) {
        return "Unauthorized access. Please login again.";
    }
    if (response.status === 403) {
        return "You are not allowed to perform this operation.";
    }
    if (response.status === 404) {
        return "Requested record was not found.";
    }
    if (response.status >= 500) {
        return "Server error. Please contact administrator.";
    }
    return result.message || "Unexpected error occurred.";
}
