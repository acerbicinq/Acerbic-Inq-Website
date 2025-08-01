// Simple Portable Text renderer for Sanity rich text content
export default function PortableText({ value }) {
  if (!value || !Array.isArray(value)) return null;

  return (
    <div class="portable-text">
      {value.map((block, index) => {
        if (block._type === 'block') {
          const { style = 'normal', children = [] } = block;
          
          const content = children.map((child, childIndex) => {
            if (child._type === 'span') {
              let text = child.text || '';
              
              // Apply marks (bold, italic, etc.)
              if (child.marks && child.marks.length > 0) {
                child.marks.forEach(mark => {
                  if (mark === 'strong') {
                    text = <strong key={`${index}-${childIndex}-strong`}>{text}</strong>;
                  } else if (mark === 'em') {
                    text = <em key={`${index}-${childIndex}-em`}>{text}</em>;
                  }
                });
              }
              
              return text;
            }
            return child.text || '';
          });

          // Render different block styles
          switch (style) {
            case 'h1':
              return <h1 key={index}>{content}</h1>;
            case 'h2':
              return <h2 key={index}>{content}</h2>;
            case 'h3':
              return <h3 key={index}>{content}</h3>;
            case 'blockquote':
              return <blockquote key={index}>{content}</blockquote>;
            default:
              return <p key={index}>{content}</p>;
          }
        }
        
        // Handle image blocks
        if (block._type === 'image') {
          return (
            <div key={index} class="image-block">
              <img 
                src={block.asset?.url} 
                alt={block.alt || ''} 
                style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;"
              />
              {block.caption && <p class="image-caption" style="font-size: 0.9em; color: #666; font-style: italic; text-align: center; margin-top: 0.5rem;">{block.caption}</p>}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}