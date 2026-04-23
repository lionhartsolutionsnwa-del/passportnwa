import QRCode from "qrcode";

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#5b1f29", light: "#f7eeda" },
  });
}

export function stampUrl(origin: string, slug: string, token: string) {
  return `${origin}/stamp/${slug}?t=${token}`;
}
