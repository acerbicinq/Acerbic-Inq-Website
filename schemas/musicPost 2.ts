import {defineType} from 'sanity'

export default defineType({
  name: 'musicPost',
  title: 'Music Post',
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
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short description of the song/album',
    },
    {
      name: 'coverArt',
      title: 'Cover Art',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'releaseType',
      title: 'Release Type',
      type: 'string',
      options: {
        list: [
          {title: 'Single', value: 'single'},
          {title: 'EP', value: 'ep'},
          {title: 'Album', value: 'album'},
          {title: 'Demo', value: 'demo'},
        ],
      },
    },
    {
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: {
        accept: '.mp3,.wav,.m4a,.ogg',
      },
      description: 'Upload your music file to host on your website',
    },
    {
      name: 'streamingLinks',
      title: 'Streaming Links',
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
                  {title: 'Spotify', value: 'spotify'},
                  {title: 'Apple Music', value: 'apple-music'},
                  {title: 'YouTube Music', value: 'youtube-music'},
                  {title: 'SoundCloud', value: 'soundcloud'},
                  {title: 'Bandcamp', value: 'bandcamp'},
                  {title: 'Other', value: 'other'},
                ],
              },
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
            },
          ],
        },
      ],
    },
    {
      name: 'lyrics',
      title: 'Lyrics',
      type: 'text',
      rows: 10,
    },
    {
      name: 'credits',
      title: 'Credits',
      type: 'text',
      rows: 4,
      description: 'Production credits, collaborators, etc.',
    },
    {
      name: 'body',
      title: 'Article Body',
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
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      description: 'Write about your creative process, inspiration, etc.',
    },
  ],
  preview: {
    select: {
      title: 'title',
      releaseType: 'releaseType',
      media: 'coverArt',
    },
    prepare(selection) {
      const {releaseType} = selection
      return {...selection, subtitle: releaseType && `${releaseType.toUpperCase()}`}
    },
  },
})