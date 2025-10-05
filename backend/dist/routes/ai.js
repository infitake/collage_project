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
router.post('/chat/sessions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentId, title } = req.body;
        const userId = req.user?.userId;
        if (!documentId || !userId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }
        // Verify document exists and belongs to user
        const document = await databaseService_1.default.getDocumentById(documentId);
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
        console.error('Create chat session error:', error);
        res.status(500).json({ error: 'Failed to create chat session' });
    }
});
// Send message to chat session
router.post('/chat/sessions/:sessionId/messages', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;
        const userId = req.user?.userId;
        if (!message || !userId) {
            return res.status(400).json({ error: 'Message is required' });
        }
        // Get chat session with document
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found or access denied' });
        }
        if (!session.document.extractedText) {
            return res.status(400).json({ error: 'Document has not been processed yet' });
        }
        // Add user message to database
        const userMessage = await databaseService_1.default.addMessage({
            content: message,
            role: 'user',
            sessionId,
        });
        // Get chat history for context
        const chatHistory = await databaseService_1.default.getMessagesBySessionId(sessionId);
        // Generate AI response using Gemini
        const aiResponse = await geminiService_1.default.answerQuestion(message, session.document.extractedText, chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
        })));
        // Add AI response to database
        const assistantMessage = await databaseService_1.default.addMessage({
            content: aiResponse.answer,
            role: 'assistant',
            sessionId,
        });
        res.json({
            message: 'Message processed successfully',
            userMessage: {
                id: userMessage.id,
                content: userMessage.content,
                role: userMessage.role,
                timestamp: userMessage.timestamp,
            },
            assistantMessage: {
                id: assistantMessage.id,
                content: assistantMessage.content,
                role: assistantMessage.role,
                timestamp: assistantMessage.timestamp,
                sources: aiResponse.sources,
                confidence: aiResponse.confidence,
            },
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});
// Get chat session messages
router.get('/chat/sessions/:sessionId/messages', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found or access denied' });
        }
        const messages = await databaseService_1.default.getMessagesBySessionId(sessionId);
        res.json({
            sessionId: session.id,
            document: {
                id: session.document.id,
                title: session.document.title,
                filename: session.document.filename,
            },
            messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                timestamp: msg.timestamp,
            })),
        });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Get user's chat sessions
router.get('/chat/sessions', auth_1.authenticateToken, async (req, res) => {
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
                document: {
                    id: session.document.id,
                    title: session.document.title,
                    filename: session.document.filename,
                },
                messageCount: session.messages.length,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            })),
        });
    }
    catch (error) {
        console.error('Get chat sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
});
// Delete chat session
router.delete('/chat/sessions/:sessionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const session = await databaseService_1.default.getChatSessionById(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Chat session not found or access denied' });
        }
        await databaseService_1.default.deleteChatSession(sessionId);
        res.json({ message: 'Chat session deleted successfully' });
    }
    catch (error) {
        console.error('Delete chat session error:', error);
        res.status(500).json({ error: 'Failed to delete chat session' });
    }
});
// Generate document summary
router.post('/documents/:documentId/summary', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const document = await databaseService_1.default.getDocumentById(documentId);
        if (!document || document.userId !== userId) {
            return res.status(404).json({ error: 'Document not found or access denied' });
        }
        if (!document.extractedText) {
            return res.status(400).json({ error: 'Document has not been processed yet' });
        }
        const summary = await geminiService_1.default.generateDocumentSummary(document.extractedText);
        // Update document with summary
        await databaseService_1.default.updateDocument(documentId, { summary });
        res.json({
            message: 'Summary generated successfully',
            summary,
        });
    }
    catch (error) {
        console.error('Generate summary error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});
// Generate suggested questions
router.post('/documents/:documentId/questions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const document = await databaseService_1.default.getDocumentById(documentId);
        if (!document || document.userId !== userId) {
            return res.status(404).json({ error: 'Document not found or access denied' });
        }
        if (!document.extractedText) {
            return res.status(400).json({ error: 'Document has not been processed yet' });
        }
        const questions = await geminiService_1.default.generateQuestions(document.extractedText);
        res.json({
            message: 'Questions generated successfully',
            questions,
        });
    }
    catch (error) {
        console.error('Generate questions error:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map