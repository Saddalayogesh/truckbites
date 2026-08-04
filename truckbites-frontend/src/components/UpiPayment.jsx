import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { buildUpiUri } from '../utils/upi';
import { formatINR } from '../utils/pricing';

/**
 * UPI QR-code payment block.
 *
 * The same platform UPI ID is used everywhere (original QR); the on-screen
 * label is always a dummy display name — the real UPI ID is never shown.
 *
 * @param {string}  label   Dummy display label under the QR (e.g. "TruckBites" or the truck name)
 * @param {number}  amount  Optional amount to pre-fill in the UPI app
 * @param {string}  note    Optional transaction note (e.g. order/plan reference)
 * @param {string}  name    Payee name embedded in the QR (defaults to TruckBites)
 */
export default function UpiPayment({ label = 'TruckBites', amount, note, name }) {
  const uri = buildUpiUri({ name, amount, note });

  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      {/* QR code — same original QR everywhere */}
      <div className="bg-white rounded-input p-4 shadow-soft border border-line">
        <QRCodeSVG
          value={uri}
          size={196}
          level="M"
          marginSize={1}
          title={label}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[11px] uppercase tracking-wider text-body/60 font-heading font-semibold">
          Scan &amp; pay
        </p>
        <p className="font-heading font-bold text-ink text-lg leading-snug break-words max-w-[240px]">{label}</p>
        {amount > 0 && (
          <p className="text-sm text-body mt-1">
            Pay <strong className="text-ink">{formatINR(amount)}</strong> by scanning with any UPI app
          </p>
        )}
        <p className="text-xs text-body/70 mt-1.5 inline-flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" strokeWidth={2} />
          Google Pay · PhonePe · Paytm · BHIM
        </p>
      </div>
    </div>
  );
}
