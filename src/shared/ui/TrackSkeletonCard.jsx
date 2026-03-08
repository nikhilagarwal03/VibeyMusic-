import React from 'react';
import Card from './Card';
import Skeleton from './Skeleton';

const TrackSkeletonCard = () => (
  <Card className="p-4">
    <Skeleton variant="rect" className="w-full aspect-square mb-4" />
    <Skeleton variant="text" className="w-3/4 mb-3" />
    <Skeleton variant="text" className="w-1/2 h-3" />
  </Card>
);

export default TrackSkeletonCard;
