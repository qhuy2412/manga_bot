import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999/api/v1";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

/**
 * Fetch all stories
 */
export const getStories = async () => {
    const res = await api.get("/stories");
    return res.data.data;
};

/**
 * Fetch a single story by slug
 */
export const getStoryBySlug = async (slug: string) => {
    const res = await api.get(`/stories/slug/${slug}`);
    return res.data.data;
};

/**
 * Fetch all chapters for a story
 */
export const getChaptersByStoryId = async (storyId: string) => {
    const res = await api.get(`/chapters/story/${storyId}`);
    return res.data.data;
};

/**
 * Fetch a single chapter detail by story ID and chapter index
 */
export const getChapterDetail = async (storyId: string, index: number) => {
    const res = await api.get(`/chapters/story/${storyId}/index/${index}`);
    return res.data.data;
};

/**
 * Fetch all genres
 */
export const getGenres = async () => {
    const res = await api.get("/genres");
    return res.data.data;
};

/**
 * Increment view count for a story
 */
export const incrementStoryViews = async (storyId: string) => {
    try {
        await api.post(`/stories/${storyId}/views`);
    } catch {
        // Ignore view error silently
    }
};
