import { Camera, Globe, Mail, Smartphone, type LucideIcon } from 'lucide-react';
import type { Doc, DocType } from '@/lib/data';
import { REQUIRED_DOCS } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

/** Short mono tags for the three required documents. */
export const DOC_TAG: Record<DocType, string> = {
  RateConf: 'RC',
  BOL: 'BOL',
  POD: 'POD',
  Lumper: 'LMP',
  ScaleTicket: 'SCL',
  FuelReceipt: 'FUEL',
  DetentionForm: 'DET',
};

const LABEL: Record<Doc['type'], string> = {
  RateConf: 'Rate confirmation',
  BOL: 'Bill of lading',
  POD: 'Proof of delivery',
  Lumper: 'Lumper receipt',
  ScaleTicket: 'Scale ticket',
  FuelReceipt: 'Fuel receipt',
  DetentionForm: 'Detention form',
  Unknown: 'Unclassified',
  InsuranceCert: 'Insurance certificate',
  CDL: 'CDL',
  MedCard: 'Medical card',
};

export const docTypeLabel = (t: Doc['type']) => LABEL[t] ?? t;

export const DOC_SOURCE_ICON: Record<Doc['source'], LucideIcon> = {
  email: Mail,
  photo: Camera,
  portal: Globe,
  driver_app: Smartphone,
};

export const DOC_SOURCE_LABEL: Record<Doc['source'], string> = {
  email: 'Email',
  photo: 'Photo',
  portal: 'Portal',
  driver_app: 'Driver app',
};

/**
 * Three tiny pills for RateConf / BOL / POD. Filled when the load has the
 * document, hollow and warm when it is still missing.
 */
export function DocDots({ docs, size = 'sm', className }: { docs: DocType[]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {REQUIRED_DOCS.map((d) => {
        const has = docs.includes(d);
        return (
          <Tooltip key={d} label={`${docTypeLabel(d)} · ${has ? 'on file' : 'missing'}`}>
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full border font-mono font-medium tabular leading-none',
                size === 'sm' ? 'h-[18px] min-w-[30px] px-1.5 text-[9.5px]' : 'h-6 min-w-[38px] px-2 text-[10.5px]',
                has ? 'border-transparent bg-good-soft text-good' : 'border-dashed border-warn/70 bg-transparent text-warn',
              )}
            >
              {DOC_TAG[d]}
            </span>
          </Tooltip>
        );
      })}
    </span>
  );
}
