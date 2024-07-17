'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useSession } from '@/lib/client-auth';
import { getImageUrl } from '@/lib/get-image-url';
import { cn } from '@/lib/utils';
import { SignInButton } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { ExternalLink, Heart } from 'lucide-react';

export default function PortfolioCard({
  item,
  favorites,
  isFavoriteCard = false,
  favoriteId,
}: {
  item: Doc<'portfolios'> | Id<'portfolios'>;
  favorites?: Map<string, string>;
  isFavoriteCard?: boolean;
  favoriteId?: Id<'favorites'>;
}) {
  const session = useSession();
  const portfolioId = typeof item === 'object' ? item._id : item;

  const queryResult = useQuery(api.portfolios.getPortfolioFromId, {
    portfolioId,
  });

  const portfolio = isFavoriteCard
    ? queryResult
    : typeof item === 'object'
      ? item
      : null;

  const addFavorite = useMutation(api.favorites.addFavorite);
  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const incrementPortfolioFavoriteCount = useMutation(
    api.portfolios.incrementPortfolioFavoriteCount,
  );
  const decrementPortfolioFavoriteCount = useMutation(
    api.portfolios.decrementPortfolioFavoriteCount,
  );

  if (!portfolio) return null;

  const imageUrl = getImageUrl(portfolio.image);
  const isFavorited =
    isFavoriteCard || (favorites && favorites.has(portfolioId));

  const handleFavoriteClick = async () => {
    if (isFavoriteCard) {
      await removeFavorite({ favoriteId: favoriteId as Id<'favorites'> });
    } else if (favorites) {
      if (isFavorited) {
        const favId = favorites.get(portfolioId);
        await removeFavorite({ favoriteId: favId as Id<'favorites'> });
        await decrementPortfolioFavoriteCount({ portfolioId });
      } else {
        await addFavorite({ portfolioId });
        await incrementPortfolioFavoriteCount({ portfolioId });
      }
    }
  };

  return (
    <Card className="w-full border-none bg-transparent relative group/card shadow-none">
      <Link  href={portfolio.link}> 
        <div>
          <div className="overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={portfolio.name}
              width={400}
              height={200}
              priority
              className="object-cover h-80 object-top w-full rounded-xl"
            />
          </div>
        </div>
        <div className="py-2 text-start">
          <h3 className="text-base text-muted-foreground group-hover/card:text-foreground transition-all duration-200">
            {portfolio.name}
          </h3>
        </div>
      </Link>

      <div className="flex flex-row items-center absolute z-10 bottom-2 right-0">
        {session.isLoggedIn ? (
          <div className="flex items-center gap-3">
            <button onClick={handleFavoriteClick}>
              <Heart
                size={18}
                className={cn(
                  'stroke-muted-foreground group-hover:stroke-emerald-500 duration-200',
                  isFavorited && 'fill-emerald-500 stroke-emerald-500',
                )}
              />
            </button>
            <Link href={portfolio.link} target="_blank">
              <ExternalLink
                size={20}
                className={cn(
                  'stroke-muted-foreground hover:stroke-emerald-500 duration-200',
                )}
              />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button>
              <SignInButton mode="modal">
                <Heart
                  size={20}
                  className={cn(
                    'stroke-muted-foreground hover:stroke-emerald-500 duration-200',
                    isFavorited && 'fill-emerald-500 stroke-emerald-500',
                  )}
                />
              </SignInButton>
            </button>
            <Link href={portfolio.link} target="_blank">
              <ExternalLink
                size={20}
                className={cn(
                  'stroke-muted-foreground hover:stroke-emerald-500 duration-200',
                )}
              />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
