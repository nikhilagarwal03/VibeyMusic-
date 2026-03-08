import React from 'react';
import { Heart } from 'lucide-react';
import { sanitizeDisplayText } from '../../lib/api';
import vibeyLogo from '../../assets/img1.png';
import { usePlayerStore } from '../../store/usePlayerStore';
import Card from './Card';
import IconButton from './IconButton';

const CollectionCard = ({ item, onOpenDetail }) => {
  const likedCollections = usePlayerStore((state) => state.likedCollections);
  const toggleLikeCollection = usePlayerStore((state) => state.toggleLikeCollection);

  const isLiked = likedCollections.some(
    (collection) => collection.id === item?.id && collection.type === item?.type
  );

  return (
    <Card
      interactive
      onClick={() => onOpenDetail(item)}
      className="p-4 text-left w-full"
    >
      <div className="w-full aspect-square bg-white/5 rounded-lg mb-4 overflow-hidden relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = vibeyLogo;
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}

        {item?.type && (
          <IconButton
            variant="overlay"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              toggleLikeCollection(item);
            }}
            aria-label={isLiked ? 'Remove from liked collections' : 'Add to liked collections'}
            className="absolute top-2 right-2"
          >
            <Heart
              className={`w-4 h-4 motion-base ${
                isLiked ? 'text-blue-300 fill-blue-300' : 'text-gray-100'
              }`}
            />
          </IconButton>
        )}
      </div>

      <h3 className="type-body font-semibold text-white line-clamp-2">{sanitizeDisplayText(item.title)}</h3>
      <p className="type-body text-gray-300 mt-1 line-clamp-2">{sanitizeDisplayText(item.subtitle)}</p>
    </Card>
  );
};

export default CollectionCard;
