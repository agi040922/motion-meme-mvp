'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CREDIT_PACKAGES, useCreditBalance } from '@/lib/credits';

type BuyCreditsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const { balance, addCredits } = useCreditBalance();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy credits">
      <div className="space-y-5 p-5">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Current balance
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{balance}</p>
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
                  className="px-4"
                  onClick={() => {
                    addCredits(pkg.credits);
                    onClose();
                  }}
                >
                  Add credits
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs leading-5 text-zinc-500">
          MVP mode: credit packs use local mock data for now. This does not touch real billing yet.
        </p>
      </div>
    </Modal>
  );
}
