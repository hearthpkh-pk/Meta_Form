import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // Validate URL
        new URL(url);

        // Fetch the HTML content
        const response = await fetch(url, {
            headers: {
                // Mimic a standard browser to avoid basic blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            // Don't follow too many redirects
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        // Extract og:title or title
        // 1. Try og:title first (usually more accurate for FB pages)
        let titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);

        // Sometimes attributes are swapped
        if (!titleMatch) {
            titleMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
        }

        // 2. Fallback to <title> tag
        if (!titleMatch) {
            titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        }

        if (titleMatch && titleMatch[1]) {
            // Clean up the title (FB often adds " | Facebook" or " - Home | Facebook" at the end)
            let rawTitle = titleMatch[1];
            // Decode basic HTML entities that might appear in titles
            rawTitle = rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

            // Remove common Facebook suffixes
            const cleanTitle = rawTitle.replace(/\s*[|\-]\s*Facebook\s*$/i, '').replace(/\s*-\s*Home\s*$/i, '').trim();

            return NextResponse.json({ title: cleanTitle });
        }

        return NextResponse.json({ error: 'Title not found in the page' }, { status: 404 });

    } catch (error: any) {
        console.error('Error fetching URL:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch the URL' }, { status: 500 });
    }
}
