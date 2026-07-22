"use client";

import { useEffect } from "react";
import { incrementStoryViews } from "@/lib/api";

export default function ViewTracker({ storyId }: { storyId: string }) {
    useEffect(() => {
        if (storyId) {
            incrementStoryViews(storyId);
        }
    }, [storyId]);

    return null;
}
