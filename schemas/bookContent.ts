import {defineType} from 'sanity'

export default defineType({
  name: 'bookContent',
  title: 'Book Content',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          {title: 'Book', value: 'book'},
          {title: 'Short Story', value: 'short-story'},
          {title: 'Magazine', value: 'magazine'},
          {title: 'Article', value: 'article'},
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Brief description or blurb',
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Alternative text for screen readers',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      description: 'International Standard Book Number (optional)',
    },
    {
      name: 'genre',
      title: 'Genre/Category',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Fiction, Non-fiction, Sci-fi, etc.',
    },
    {
      name: 'status',
      title: 'Publication Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'In Progress', value: 'in-progress'},
          {title: 'Complete', value: 'complete'},
          {title: 'Published', value: 'published'},
        ],
      },
      initialValue: 'draft',
    },
    {
      name: 'readingSettings',
      title: 'Reading Experience Settings',
      type: 'object',
      fields: [
        {
          name: 'allowFullRead',
          title: 'Allow Full Reading',
          type: 'boolean',
          initialValue: true,
          description: 'Allow users to read the entire content on your website',
        },
        {
          name: 'showPreview',
          title: 'Show Preview Only',
          type: 'boolean',
          initialValue: false,
          description: 'Show only preview/excerpt, require purchase for full content',
        },
        {
          name: 'enableBookmarks',
          title: 'Enable Reader Bookmarks',
          type: 'boolean',
          initialValue: true,
          description: 'Allow users to bookmark their reading progress',
        },
        {
          name: 'showWordCount',
          title: 'Show Word Count',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'estimatedReadTime',
          title: 'Show Estimated Read Time',
          type: 'boolean',
          initialValue: true,
        },
      ],
    },
    {
      name: 'accessibilitySettings',
      title: 'Accessibility Settings',
      type: 'object',
      fields: [
        {
          name: 'enableTextToSpeech',
          title: 'Enable Text-to-Speech',
          type: 'boolean',
          initialValue: true,
          description: 'Allow users to have content read aloud',
        },
        {
          name: 'customAudioNarration',
          title: 'Custom Audio Narration',
          type: 'object',
          fields: [
            {
              name: 'hasCustomAudio',
              title: 'Has Custom Audio Narration',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'narrator',
              title: 'Narrator',
              type: 'string',
              description: 'Name of the narrator',
            },
            {
              name: 'audioFiles',
              title: 'Chapter Audio Files',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'chapterNumber',
                      title: 'Chapter Number',
                      type: 'number',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'audioFile',
                      title: 'Audio File',
                      type: 'file',
                      options: {
                        accept: '.mp3,.wav,.m4a,.ogg',
                      },
                    },
                    {
                      name: 'duration',
                      title: 'Duration',
                      type: 'string',
                      description: 'Audio duration (e.g., "45:30")',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'readingLevel',
          title: 'Reading Level',
          type: 'string',
          options: {
            list: [
              {title: 'Elementary', value: 'elementary'},
              {title: 'Middle School', value: 'middle-school'},
              {title: 'High School', value: 'high-school'},
              {title: 'College', value: 'college'},
              {title: 'Adult', value: 'adult'},
            ],
          },
          description: 'Helps with accessibility and content discovery',
        },
        {
          name: 'dyslexiaFriendly',
          title: 'Dyslexia-Friendly Features',
          type: 'object',
          fields: [
            {
              name: 'enableDyslexiaFont',
              title: 'Enable Dyslexia-Friendly Font Option',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'enableLineSpacing',
              title: 'Enable Adjustable Line Spacing',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'enableHighContrast',
              title: 'Enable High Contrast Mode',
              type: 'boolean',
              initialValue: true,
            },
          ],
        },
        {
          name: 'languageSettings',
          title: 'Language Settings',
          type: 'object',
          fields: [
            {
              name: 'primaryLanguage',
              title: 'Primary Language',
              type: 'string',
              initialValue: 'en',
              description: 'ISO language code (e.g., "en", "es", "fr")',
            },
            {
              name: 'translations',
              title: 'Available Translations',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'language',
                      title: 'Language',
                      type: 'string',
                      description: 'ISO language code',
                    },
                    {
                      name: 'languageName',
                      title: 'Language Name',
                      type: 'string',
                      description: 'Display name (e.g., "Spanish", "French")',
                    },
                    {
                      name: 'translator',
                      title: 'Translator',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'chapterTitle',
              title: 'Chapter Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'chapterNumber',
              title: 'Chapter Number',
              type: 'number',
              validation: (Rule) => Rule.required().positive(),
            },
            {
              name: 'chapterSlug',
              title: 'Chapter Slug',
              type: 'slug',
              options: {
                source: 'chapterTitle',
                maxLength: 96,
              },
            },
            {
              name: 'summary',
              title: 'Chapter Summary',
              type: 'text',
              rows: 2,
              description: 'Brief summary of what happens in this chapter',
            },
            {
              name: 'content',
              title: 'Chapter Content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [
                    {title: 'Normal', value: 'normal'},
                    {title: 'H1', value: 'h1'},
                    {title: 'H2', value: 'h2'},
                    {title: 'H3', value: 'h3'},
                    {title: 'Quote', value: 'blockquote'},
                    {title: 'Chapter Break', value: 'chapter-break'},
                  ],
                  marks: {
                    decorators: [
                      {title: 'Strong', value: 'strong'},
                      {title: 'Emphasis', value: 'em'},
                      {title: 'Underline', value: 'underline'},
                      {title: 'Strike', value: 'strike-through'},
                    ],
                    annotations: [
                      {
                        title: 'Internal Link',
                        name: 'internalLink',
                        type: 'object',
                        fields: [
                          {
                            title: 'Reference',
                            name: 'reference',
                            type: 'reference',
                            to: [{type: 'bookContent'}],
                          },
                        ],
                      },
                      {
                        title: 'External Link',
                        name: 'link',
                        type: 'object',
                        fields: [
                          {
                            title: 'URL',
                            name: 'href',
                            type: 'url',
                          },
                        ],
                      },
                      {
                        title: 'Pronunciation Guide',
                        name: 'pronunciation',
                        type: 'object',
                        fields: [
                          {
                            title: 'Phonetic Spelling',
                            name: 'phonetic',
                            type: 'string',
                            description: 'How to pronounce this word/phrase',
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  type: 'image',
                  options: {hotspot: true},
                  fields: [
                    {
                      name: 'caption',
                      title: 'Caption',
                      type: 'string',
                    },
                    {
                      name: 'alt',
                      title: 'Alt Text',
                      type: 'string',
                      description: 'Alternative text for screen readers',
                      validation: (Rule) => Rule.required(),
                    },
                  ],
                },
              ],
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'wordCount',
              title: 'Word Count',
              type: 'number',
              description: 'Approximate word count for this chapter',
            },
            {
              name: 'publishedAt',
              title: 'Chapter Published Date',
              type: 'datetime',
              description: 'When this chapter was published (for serialized content)',
            },
          ],
        },
      ],
    },
    {
      name: 'totalWordCount',
      title: 'Total Word Count',
      type: 'number',
      description: 'Total word count across all chapters',
    },
    {
      name: 'dedication',
      title: 'Dedication',
      type: 'text',
      rows: 3,
      description: 'Book dedication (optional)',
    },
    {
      name: 'acknowledgments',
      title: 'Acknowledgments',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H3', value: 'h3'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
    },
    {
      name: 'authorNotes',
      title: 'Author Notes',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H3', value: 'h3'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
      description: 'Behind-the-scenes notes, inspiration, etc.',
    },
    {
      name: 'purchaseLinks',
      title: 'Purchase Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'Amazon Kindle', value: 'amazon-kindle'},
                  {title: 'Apple Books', value: 'apple-books'},
                  {title: 'Barnes & Noble', value: 'barnes-noble'},
                  {title: 'Kobo', value: 'kobo'},
                  {title: 'Google Play Books', value: 'google-books'},
                  {title: 'Direct Purchase', value: 'direct'},
                  {title: 'Other', value: 'other'},
                ],
              },
            },
            {
              name: 'url',
              title: 'Purchase URL',
              type: 'url',
            },
            {
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'e.g., "$9.99" or "Free"',
            },
          ],
        },
      ],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Keywords, themes, topics',
    },
    {
      name: 'series',
      title: 'Series Information',
      type: 'object',
      fields: [
        {
          name: 'seriesTitle',
          title: 'Series Title',
          type: 'string',
        },
        {
          name: 'bookNumber',
          title: 'Book Number in Series',
          type: 'number',
        },
        {
          name: 'totalBooks',
          title: 'Total Books in Series',
          type: 'number',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      contentType: 'contentType',
      status: 'status',
      media: 'coverImage',
    },
    prepare(selection) {
      const {contentType, status} = selection
      return {...selection, subtitle: `${contentType || 'Content'} - ${status || 'Draft'}`}
    },
  },
})