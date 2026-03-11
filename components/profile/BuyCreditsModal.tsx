'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CREDIT_PACKAGES, purchaseMockCredits, useCreditBalance } from '@/lib/credits';
import { useState } from 'react';

type BuyCreditsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const { balance, isLoading } = useCreditBalance();
  const [isPendingId, setIsPendingId] = useState<string | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy credits">
      <div className="space-y-5 p-5">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Current balance
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-900">
            {isLoading ? '...' : balance}
          </p>
        </div>

        <div className="space-y-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div>
                <p className="text-lg font-bold text-zinc-900">{pkg.credits} credits</p>
                <p className="mt-1 text-sm text-zinc-500">{pkg.note}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-semibold text-zinc-500">{pkg.priceLabel}</span>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPendingId === pkg.id}
                  className="px-4"
                  onClick={async () => {
                    setIsPendingId(pkg.id);
                    try {
                      await purchaseMockCredits(pkg.credits, pkg.id);
                      onClose();
                    } finally {
                      setIsPendingId(null);
                    }
                  }}
                >
                  {isPendingId === pkg.id ? 'Adding...' : 'Add credits'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs leading-5 text-zinc-500">
          MVP mode: credit packs write to Supabase mock credit tables for now. This does not touch real billing yet.
        </p>
      </div>
    </Modal>
  );
}
