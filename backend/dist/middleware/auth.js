"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('Extracted token:', token ? 'Present' : 'Missing');
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token decoded successfully for user:', decoded.email);
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        console.log('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            // Token is invalid, but we continue without user
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map