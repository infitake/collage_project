declare class GeminiService {
    private genAI;
    constructor();
    generateDocumentSummary(documentText: string): Promise<string>;
    answerQuestion(question: string, documentText: string, chatHistory?: any[]): Promise<{
        answer: string;
        sources: string[];
        confidence: number;
    }>;
    extractKeyPoints(documentText: string): Promise<string[]>;
    generateQuestions(documentText: string): Promise<string[]>;
}
declare const _default: GeminiService;
export default _default;
//# sourceMappingURL=geminiService.d.ts.map