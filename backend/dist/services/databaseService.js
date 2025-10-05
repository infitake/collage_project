"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
class DatabaseService {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    // User operations
    async createUser(userData) {
        return await this.prisma.user.create({
            data: userData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true,
            },
        });
    }
    async findUserByEmail(email) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findUserById(id) {
        return await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true,
            },
        });
    }
    // Document operations
    async createDocument(documentData) {
        return await this.prisma.document.create({
            data: documentData,
        });
    }
    async updateDocument(id, updateData) {
        return await this.prisma.document.update({
            where: { id },
            data: updateData,
        });
    }
    async getDocumentsByUserId(userId) {
        return await this.prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDocumentById(id) {
        return await this.prisma.document.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async deleteDocument(id) {
        return await this.prisma.document.delete({
            where: { id },
        });
    }
    // Chat session operations
    async createChatSession(sessionData) {
        return await this.prisma.chatSession.create({
            data: sessionData,
        });
    }
    async getChatSessionsByUserId(userId) {
        return await this.prisma.chatSession.findMany({
            where: { userId },
            include: {
                document: {
                    select: {
                        id: true,
                        title: true,
                        filename: true,
                    },
                },
                messages: {
                    orderBy: { timestamp: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getChatSessionById(id) {
        return await this.prisma.chatSession.findUnique({
            where: { id },
            include: {
                document: true,
                messages: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });
    }
    async addMessage(messageData) {
        return await this.prisma.message.create({
            data: messageData,
        });
    }
    async getMessagesBySessionId(sessionId) {
        return await this.prisma.message.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
        });
    }
    async updateChatSession(id, updateData) {
        return await this.prisma.chatSession.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteChatSession(id) {
        return await this.prisma.chatSession.delete({
            where: { id },
        });
    }
    // Team operations
    async createTeam(teamData) {
        return await this.prisma.team.create({
            data: teamData,
        });
    }
    async addTeamMember(teamMemberData) {
        return await this.prisma.teamMember.create({
            data: teamMemberData,
        });
    }
    async getTeamsByUserId(userId) {
        return await this.prisma.team.findMany({
            where: {
                OR: [
                    { creatorId: userId },
                    { members: { some: { userId } } },
                ],
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }
    // Statistics
    async getUserStats(userId) {
        const [documentCount, chatSessionCount, messageCount] = await Promise.all([
            this.prisma.document.count({ where: { userId } }),
            this.prisma.chatSession.count({ where: { userId } }),
            this.prisma.message.count({
                where: {
                    session: { userId },
                },
            }),
        ]);
        return {
            documentCount,
            chatSessionCount,
            messageCount,
        };
    }
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
exports.default = new DatabaseService();
//# sourceMappingURL=databaseService.js.map