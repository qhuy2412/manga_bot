import React from "react";
import { notFound } from "next/navigation";
import { getStoryBySlug, getChaptersByStoryId, getChapterDetail } from "@/lib/api";
import ChapterReaderClient from "@/components/ChapterReaderClient";

interface PageProps {
    params: Promise<{ slug: string; index: string }>;
}

export default async function ChapterPage({ params }: PageProps) {
    const { slug, index } = await params;
    const chapterIndex = parseInt(index, 10);

    if (isNaN(chapterIndex) || chapterIndex < 0) {
        notFound();
    }

    let story: any = null;
    let chapters: any[] = [];
    let currentChapter: any = null;

    try {
        // 1. Fetch story details
        story = await getStoryBySlug(slug);
        if (story) {
            // 2. Fetch list of all chapters (to populate navigation dropdown)
            chapters = await getChaptersByStoryId(story._id) || [];
            
            // 3. Fetch current chapter details (to get images list)
            currentChapter = await getChapterDetail(story._id, chapterIndex);
        }
    } catch (err) {
        console.error("Error loading chapter page on server:", err);
    }

    if (!story || !currentChapter) {
        notFound();
    }

    return (
        <ChapterReaderClient
            storySlug={slug}
            storyTitle={story.title}
            chapters={chapters}
            currentChapter={currentChapter}
        />
    );
}
