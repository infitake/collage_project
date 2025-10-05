"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const databaseService_1 = __importDefault(require("../services/databaseService"));
const geminiService_1 = __importDefault(require("../services/geminiService"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'));
        }
    }
});
// Helper function to extract text from different file types
async function extractTextFromFile(filePath, mimeType) {
    try {
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await pdf_parse_1.default(dataBuffer);
            return data.text;
        }
        else if (mimeType === 'text/plain') {
            return fs_1.default.readFileSync(filePath, 'utf-8');
        }
        else {
            // For other file types, return a placeholder
            return 'Text extraction not yet implemented for this file type.';
        }
    }
    catch (error) {
        console.error('Text extraction error:', error);
        return 'Failed to extract text from document.';
    }
}
// Upload document
router.post('/upload', auth_1.authenticateToken, upload.single('document'), async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        console.log('Content-Type:', req.headers['content-type']);
        if (!req.file) {
            console.log('No file found in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user ID from JWT token
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Create document in database
        const document = await databaseService_1.default.createDocument({
            title: req.file.originalname,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            userId,
            status: 'processing'
        });
        // Process document asynchronously
        setImmediate(async () => {
            try {
                // Extract text from document
                const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
                // Generate summary using AI
                let summary = '';
                try {
                    summary = await geminiService_1.default.generateDocumentSummary(extractedText);
                }
                catch (aiError) {
                    console.error('AI summary generation failed:', aiError);
                    summary = 'AI summary generation is currently unavailable.';
                }
                // Update document with extracted text and summary
                await databaseService_1.default.updateDocument(document.id, {
                    status: 'completed',
                    extractedText,
                    summary
                });
            }
            catch (error) {
                console.error('Document processing error:', error);
                await databaseService_1.default.updateDocument(document.id, {
                    status: 'error'
                });
            }
        });
        res.json({
            message: 'File uploaded successfully',
            document: {
                id: document.id,
                title: document.title,
                filename: document.filename,
                fileSize: document.fileSize,
                status: document.status,
                createdAt: document.createdAt
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});
// Get all documents for a user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const documents = await databaseService_1.default.getDocumentsByUserId(userId);
        res.json({ documents });
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});
// Get specific document
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const document = await databaseService_1.default.getDocumentById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        // Check if user owns the document
        if (document.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ document });
    }
    catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});
// Delete document
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const document = await databaseService_1.default.getDocumentById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        // Check if user owns the document
        if (document.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Delete file from filesystem
        if (fs_1.default.existsSync(document.filePath)) {
            fs_1.default.unlinkSync(document.filePath);
        }
        // Remove from database
        await databaseService_1.default.deleteDocument(req.params.id);
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map