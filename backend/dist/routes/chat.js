"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiService_1 = __importDefault(require("../services/geminiService"));
const databaseService_1 = __importDefault(require("../services/databaseService"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create new chat session
router.post('/sessions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentId, title } = req.body;
        const userId = req.user?.userId;
        if (!documentId || !userId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }
        // Verify document exists and belongs to user
        console.log('Looking for document ID:', documentId);
        console.log('User ID:', userId);
        const document = await databaseService_1.default.getDocumentById(documentId);
        console.log('Document found:', document ? 'Yes' : 'No');
        if (document) {
            console.log('Document userId:', document.userId);
            console.log('Request userId:', userId);
            console.log('User match:', document.userId === userId);
        }
        if (!document || document.userId !== userId) {
            return res.status(404).json({ error: 'Document not found or access denied' });
        }
        const session = await databaseService_1.default.createChatSession({
            title: title || `Chat about ${document.title}`,
            userId,
            documentId,
        });
        res.status(201).json({
            message: 'Chat session created successfully',
            session: {
                id: session.id,
                title: session.title,
                documentId: session.documentId,
                userId: session.userId,
                createdAt: session.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create chat session' });
    }
});
// Get single chat session with document info
router.get('/sessions/:sessionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        const document = await databaseService_1.default.getDocumentById(session.documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const messages = await databaseService_1.default.getMessagesBySessionId(sessionId);
        res.json({
            sessionId: session.id,
            document: {
                id: document.id,
                title: document.title,
                filename: document.filename
            },
            messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                sources: msg.sources ? JSON.parse(msg.sources) : [],
                confidence: msg.confidence || 0
            }))
        });
    }
    catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to fetch chat session' });
    }
});
// Send message to chat session
router.post('/sessions/:sessionId/messages', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get chat session
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        // Get document content
        const document = await databaseService_1.default.getDocumentById(session.documentId);
        if (!document || !document.extractedText) {
            return res.status(404).json({ error: 'Document content not available' });
        }
        // Add user message to database
        const userMessage = await databaseService_1.default.addMessage({
            sessionId,
            role: 'user',
            content: message,
        });
        // Get chat history for context
        const chatHistory = await databaseService_1.default.getMessagesBySessionId(sessionId);
        // Generate AI response using real document content
        let aiContent = 'I apologize, but I cannot process your question at the moment.';
        let sources = [];
        let confidence = 0.0;
        try {
            const aiResponse = await geminiService_1.default.answerQuestion(message, document.extractedText, chatHistory.slice(-5) // Last 5 messages for context
            );
            if (aiResponse && typeof aiResponse === 'object' && aiResponse.answer) {
                aiContent = aiResponse.answer;
                sources = aiResponse.sources || [];
                confidence = aiResponse.confidence || 0.8;
            }
        }
        catch (error) {
            console.error('AI response error:', error);
            aiContent = 'I apologize, but I encountered an error while processing your question. Please try again.';
        }
        // Add AI response to database
        const aiMessage = await databaseService_1.default.addMessage({
            sessionId,
            role: 'assistant',
            content: aiContent,
        });
        res.json({
            message: 'Message sent successfully',
            userMessage: {
                id: userMessage.id,
                role: userMessage.role,
                content: userMessage.content,
                timestamp: userMessage.timestamp,
            },
            assistantMessage: {
                id: aiMessage.id,
                role: aiMessage.role,
                content: aiMessage.content,
                timestamp: aiMessage.timestamp,
                sources: sources,
                confidence: confidence,
            }
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
// Get chat session messages
router.get('/sessions/:sessionId/messages', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        const messages = await databaseService_1.default.getMessagesBySessionId(sessionId);
        res.json({
            sessionId: session.id,
            messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                sources: msg.sources ? JSON.parse(msg.sources) : [],
                confidence: msg.confidence || 0
            }))
        });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Get all chat sessions for a user
router.get('/sessions', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const sessions = await databaseService_1.default.getChatSessionsByUserId(userId);
        res.json({
            sessions: sessions.map(session => ({
                id: session.id,
                title: session.title,
                documentId: session.documentId,
                userId: session.userId,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            }))
        });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
});
// Delete chat session
router.delete('/sessions/:sessionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found' });
        }
        await databaseService_1.default.deleteChatSession(sessionId);
        res.json({ message: 'Chat session deleted successfully' });
    }
    catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete chat session' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map