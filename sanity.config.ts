import {defineConfig} from 'sanity'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
// Preview action for musicPost, podcastEpisode, bookContent
const previewAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const doc = (props.draft || props.published) as { slug?: { current?: string }, _type?: string };
  const slug = doc?.slug?.current ?? '';
  const docType = doc?._type ?? '';
  const getUrl = (type: string, slug: string) => {
    switch (type) {
      case 'musicPost': return `http://localhost:4321/music/${slug}`;
      case 'podcastEpisode': return `http://localhost:4321/podcast/${slug}`;
      case 'bookContent': return `http://localhost:4321/books/${slug}`;
      default: return null;
    }
  };
  const url = slug ? getUrl(docType, slug) : null;
  return {
    label: 'Preview',
    icon: () => '👁️',
    onHandle: () => {
      if (url) window.open(url, '_blank');
      props.onComplete();
    },
    disabled: !url,
  };
};
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Acerbic Inq Website',

  projectId: 'gcfgnt56',
  dataset: 'ai-website',

  plugins: [
    deskTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  // Add file upload configuration
  file: {
    assetSources: (previousAssetSources) => {
      return previousAssetSources.filter((assetSource) => assetSource.name !== 'unsplash')
    }
  },

  // Add preview URLs configuration
  document: {
    actions: (prev, context) => {
      if ([
        'musicPost',
        'podcastEpisode',
        'bookContent'
      ].includes(context.schemaType)) {
        return [...prev, previewAction];
      }
      return prev;
    }
  }
})