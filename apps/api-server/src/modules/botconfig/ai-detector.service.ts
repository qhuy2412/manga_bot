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

        // Rút gọn bớt dung lượng nếu vượt quá 40KB
        if (cleanedHtml.length > 40000) {
            cleanedHtml = cleanedHtml.substring(0, 40000);
        }

        return { cleanedHtml, rawHtml };
    }

    /**
     * Dùng 1 PROMPT DUY NHẤT cho Gemini AI để tự động dò 5 CSS Selectors
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

        // 1. Tải và làm sạch DOM trang chi tiết truyện
        const { cleanedHtml: storyCleanedHtml, rawHtml: storyRawHtml } = await this.fetchAndCleanDOM(targetUrl);
        const $story = cheerio.load(storyRawHtml);

        // 2. Tìm nhanh link 1 chương mẫu từ trang truyện để tải ngầm trước khi gửi AI
        let chapterCleanedHtml = "";
        let chapterRawHtml = "";

        const candidateLinks: string[] = [];
        $story("a[href]").each((_, el) => {
            const href = $story(el).attr("href");
            const text = $story(el).text().toLowerCase();
            if (href && (href.includes("chap") || href.includes("chuong") || href.includes("read") || /\d+/.test(text))) {
                candidateLinks.push(href);
            }
        });

        if (candidateLinks.length > 0) {
            let sampleHref = candidateLinks[0];
            let sampleUrl = sampleHref.trim();
            if (sampleUrl.startsWith("//")) sampleUrl = `https:${sampleUrl}`;
            else if (sampleUrl.startsWith("/")) {
                const urlObj = new URL(targetUrl);
                sampleUrl = `${urlObj.origin}${sampleUrl}`;
            }

            try {
                const chapRes = await this.fetchAndCleanDOM(sampleUrl);
                chapterCleanedHtml = chapRes.cleanedHtml;
                chapterRawHtml = chapRes.rawHtml;
            } catch (err: any) {
                console.warn("[AIDetectorService] Không thể tải trước trang đọc chương mẫu:", err.message);
            }
        }

        // 3. Gộp 2 cây DOM thành 1 PROMPT DUY NHẤT cho AI phân tích 1 lần duy nhất
        const prompt = `Bạn là một chuyên gia Web Scraping & Cheerio Selector.
Dưới đây là cây HTML của một website truyện tranh:

==================== 1. TRANG CHI TIẾT TRUYỆN DOM ====================
${storyCleanedHtml}

${chapterCleanedHtml ? `==================== 2. TRANG ĐỌC CHƯƠNG MẪU DOM ====================
${chapterCleanedHtml}` : ""}

Nhiệm vụ: Hãy phân tích cấu trúc DOM trên và tìm ra 5 CSS Selectors (dành cho Cheerio/jQuery) chính xác nhất:
1. titleSelector: Selector trích xuất Tiêu đề/Tên bộ truyện (từ Trang Chi Tiết).
2. authorSelector: Selector trích xuất Tên tác giả (từ Trang Chi Tiết).
3. descriptionSelector: Selector trích xuất Nội dung mô tả/Tóm tắt truyện (từ Trang Chi Tiết).
4. chapterListSelector: Selector trích xuất các thẻ <a> liên kết đến từng chương truyện trong danh sách chương (từ Trang Chi Tiết).
5. imageSelector: Selector trích xuất các thẻ <img> chứa ảnh trang đọc truyện (từ Trang Đọc Chương).

Yêu cầu:
- Selector ngắn gọn, tận dụng class hoặc ID đặc trưng.
- chapterListSelector phải trỏ đúng các thẻ <a> danh sách chương.
- Trả về JSON duy nhất theo đúng Schema được yêu cầu.`;

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

        // 4. Kiểm thử lại các selector AI vừa phát hiện trên raw HTML
        const title = detectedSelectors.titleSelector ? $story(detectedSelectors.titleSelector).first().text().trim() : "";
        const author = detectedSelectors.authorSelector ? $story(detectedSelectors.authorSelector).first().text().trim() : "";
        const description = detectedSelectors.descriptionSelector ? $story(detectedSelectors.descriptionSelector).first().text().trim() : "";
        const chaptersCount = detectedSelectors.chapterListSelector ? $story(detectedSelectors.chapterListSelector).length : 0;

        let imagesCount = 0;
        if (chapterRawHtml && detectedSelectors.imageSelector) {
            const $chap = cheerio.load(chapterRawHtml);
            imagesCount = $chap(detectedSelectors.imageSelector).length;
        }

        return {
            selectors: detectedSelectors,
            preview: {
                title: title || "Không bóc tách được",
                author: author || "Không bóc tách được",
                description: description || "Không bóc tách được",
                chaptersCount,
                imagesCount
            }
        };
    }
}
