import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../../config/config";
import { AppError } from "../../shared/errors/AppError";

export class AIDetectorService {
    /**
     * Tải và làm sạch cây DOM để gửi cho AI phân tích
     */
    private static async fetchAndCleanDOM(targetUrl: string): Promise<{ cleanedHtml: string; rawHtml: string }> {
        const res = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            timeout: 15000
        });

        const rawHtml = res.data;
        const $ = cheerio.load(rawHtml);

        // Loại bỏ các thẻ rác không cần thiết để làm sạch DOM
        $("script, style, svg, noscript, iframe, header, footer, nav, form, button, link, meta").remove();
        $("[style]").removeAttr("style");
        $("[onclick]").removeAttr("onclick");

        // Lấy HTML body sạch
        let cleanedHtml = $("body").html() || $.html();

        // Rút gọn bớt dung lượng nếu vượt quá 60KB
        if (cleanedHtml.length > 60000) {
            cleanedHtml = cleanedHtml.substring(0, 60000);
        }

        return { cleanedHtml, rawHtml };
    }

    /**
     * Dùng Gemini AI tự động dò 5 CSS Selectors từ URL trang truyện mẫu
     */
    static async detectSelectors(targetUrl: string) {
        const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new AppError(
                "Chưa cấu hình GEMINI_API_KEY trong file .env! Vui lòng thêm GEMINI_API_KEY=your_key vào file .env của api-server.",
                400,
                "GEMINI_KEY_MISSING"
            );
        }

        const { cleanedHtml, rawHtml } = await this.fetchAndCleanDOM(targetUrl);

        const prompt = `Bạn là một chuyên gia Web Scraping & Cheerio Selector.
Dưới đây là một đoạn cây HTML đã làm sạch của một trang chi tiết truyện tranh:

==================== HTML DOM START ====================
${cleanedHtml}
==================== HTML DOM END ====================

Nhiệm vụ của bạn: Hãy phân tích cấu trúc DOM trên và tìm ra 5 CSS Selectors (dành cho Cheerio/jQuery) tối ưu nhất:
1. titleSelector: Selector trích xuất Tiêu đề/Tên bộ truyện.
2. authorSelector: Selector trích xuất Tên tác giả.
3. descriptionSelector: Selector trích xuất Nội dung mô tả/Tóm tắt truyện.
4. chapterListSelector: Selector trích xuất các thẻ <a> liên kết đến từng chương truyện trong danh sách chương.
5. imageSelector: Selector trích xuất các thẻ <img> chứa ảnh trang truyện trong trang đọc chương.

Lưu ý:
- Selector phải ngắn gọn, chính xác, tận dụng class hoặc ID đặc trưng.
- chapterListSelector phải trỏ đúng thẻ <a> chứa liên kết chương.
- Trả về kết quả JSON theo đúng Schema được yêu cầu.`;

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titleSelector: { type: Type.STRING },
                        authorSelector: { type: Type.STRING },
                        descriptionSelector: { type: Type.STRING },
                        chapterListSelector: { type: Type.STRING },
                        imageSelector: { type: Type.STRING }
                    },
                    required: [
                        "titleSelector",
                        "authorSelector",
                        "descriptionSelector",
                        "chapterListSelector",
                        "imageSelector"
                    ]
                }
            }
        });

        const textResult = response.text;
        if (!textResult) {
            throw new AppError("Gemini AI không trả về kết quả hợp lệ.", 500, "AI_NO_RESPONSE");
        }

        const detectedSelectors = JSON.parse(textResult);

        // Kiểm thử lại các selector AI vừa dò trên raw HTML
        const $ = cheerio.load(rawHtml);

        const title = detectedSelectors.titleSelector ? $(detectedSelectors.titleSelector).first().text().trim() : "";
        const author = detectedSelectors.authorSelector ? $(detectedSelectors.authorSelector).first().text().trim() : "";
        const description = detectedSelectors.descriptionSelector ? $(detectedSelectors.descriptionSelector).first().text().trim() : "";
        const chaptersCount = detectedSelectors.chapterListSelector ? $(detectedSelectors.chapterListSelector).length : 0;

        return {
            selectors: detectedSelectors,
            preview: {
                title: title || "Không bóc tách được",
                author: author || "Không bóc tách được",
                description: description || "Không bóc tách được",
                chaptersCount
            }
        };
    }
}
