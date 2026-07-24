import "server-only";

// Minimal Steadfast (Packzy) courier client.
// Docs: https://portal.packzy.com/api/v1  — auth via Api-Key / Secret-Key headers.

const BASE = "https://portal.packzy.com/api/v1";

export type SteadfastCreds = { apiKey: string; secretKey: string };

function headers(creds: SteadfastCreds) {
  return {
    "Api-Key": creds.apiKey,
    "Secret-Key": creds.secretKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export type CreateParcelInput = {
  invoice: string; // our order code (unique per Steadfast account)
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
};

export type CreateParcelResult = {
  consignmentId: string;
  trackingCode: string;
  status: string;
};

export async function createParcel(
  creds: SteadfastCreds,
  input: CreateParcelInput,
): Promise<CreateParcelResult> {
  const res = await fetch(`${BASE}/create_order`, {
    method: "POST",
    headers: headers(creds),
    body: JSON.stringify({
      invoice: input.invoice,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      cod_amount: input.codAmount,
      note: input.note ?? "",
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.consignment) {
    throw new Error(data?.message || `Steadfast create_order failed (${res.status})`);
  }
  const c = data.consignment;
  return {
    consignmentId: String(c.consignment_id),
    trackingCode: String(c.tracking_code ?? ""),
    status: String(c.status ?? "in_review"),
  };
}

export async function statusByConsignment(
  creds: SteadfastCreds,
  consignmentId: string,
): Promise<string> {
  const res = await fetch(`${BASE}/status_by_cid/${consignmentId}`, {
    headers: headers(creds),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Steadfast status failed (${res.status})`);
  return String(data?.delivery_status ?? "unknown");
}
