declare class DatabaseService {
    private prisma;
    constructor();
    createUser(userData: {
        email: string;
        name: string;
        password: string;
        avatar?: string;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        createdAt: Date;
    }>;
    findUserByEmail(email: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findUserById(id: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        createdAt: Date;
    } | null>;
    createDocument(documentData: {
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        userId: string;
        status?: string;
        extractedText?: string;
        summary?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        status: string;
        extractedText: string | null;
        summary: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }>;
    updateDocument(id: string, updateData: {
        status?: string;
        extractedText?: string;
        summary?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        status: string;
        extractedText: string | null;
        summary: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }>;
    getDocumentsByUserId(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        status: string;
        extractedText: string | null;
        summary: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }[]>;
    getDocumentById(id: string): Promise<({
        user: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        status: string;
        extractedText: string | null;
        summary: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }) | null>;
    deleteDocument(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        filename: string;
        originalName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        status: string;
        extractedText: string | null;
        summary: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }>;
    createChatSession(sessionData: {
        title?: string;
        userId: string;
        documentId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        documentId: string;
    }>;
    getChatSessionsByUserId(userId: string): Promise<({
        document: {
            id: string;
            title: string;
            filename: string;
        };
        messages: {
            id: string;
            role: string;
            content: string;
            timestamp: Date;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        documentId: string;
    })[]>;
    getChatSessionById(id: string): Promise<({
        document: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            filename: string;
            originalName: string;
            filePath: string;
            fileSize: number;
            mimeType: string;
            status: string;
            extractedText: string | null;
            summary: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
        };
        messages: {
            id: string;
            role: string;
            content: string;
            timestamp: Date;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        documentId: string;
    }) | null>;
    addMessage(messageData: {
        content: string;
        role: string;
        sessionId: string;
    }): Promise<{
        id: string;
        role: string;
        content: string;
        timestamp: Date;
        sessionId: string;
    }>;
    getMessagesBySessionId(sessionId: string): Promise<{
        id: string;
        role: string;
        content: string;
        timestamp: Date;
        sessionId: string;
    }[]>;
    updateChatSession(id: string, updateData: {
        title?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        documentId: string;
    }>;
    deleteChatSession(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        documentId: string;
    }>;
    createTeam(teamData: {
        name: string;
        description?: string;
        creatorId: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        creatorId: string;
    }>;
    addTeamMember(teamMemberData: {
        userId: string;
        teamId: string;
        role: string;
    }): Promise<{
        id: string;
        userId: string;
        teamId: string;
        role: string;
    }>;
    getTeamsByUserId(userId: string): Promise<({
        creator: {
            name: string;
            id: string;
            email: string;
        };
        members: ({
            user: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            id: string;
            userId: string;
            teamId: string;
            role: string;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        creatorId: string;
    })[]>;
    getUserStats(userId: string): Promise<{
        documentCount: number;
        chatSessionCount: number;
        messageCount: number;
    }>;
    disconnect(): Promise<void>;
}
declare const _default: DatabaseService;
export default _default;
//# sourceMappingURL=databaseService.d.ts.map