module.exports = {
    MONGO_URI: "mongodb+srv://sss_db:Singaji123@cluster0.ybuk2zo.mongodb.net/sss_project?retryWrites=true&w=majority",
    PORT: 5000,
    CLIENT_URL: "http://localhost:5173",

    // JWT_CONFIGS
    JWT_SECRET: "sss_project",
    JWT_EXPIRES_IN: "1h",
    JWT_REFRESH_EXPIRES_IN: "1d",

    // JWT_REFRESH_TOKEN_SECRET
    JWT_REFRESH_SECRET: "sss_project_refresh",
    JWT_REFRESH_EXPIRE: "7d",
    JWT_COOKIE_EXPIRE: "1d",

    NODE_ENV: "development"
}