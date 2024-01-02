import rss, { pagesGlobToRssItems } from '@astrojs/rss';import { async } from 'astro';


export async function GET(context) {
    return rss({
        title: 'AstroLearner | Blog',
        description: 'My journey learning Astro',
        site: context.site,
        items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')),
        customData: `<language>en-us</language>`,
    });
};