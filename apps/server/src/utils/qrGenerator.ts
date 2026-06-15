import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

/**
 * Generate a QR code image as a data URL (PNG)
 */
export async function generateQrImage(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
}

/**
 * Generate a Code128 barcode image as a PNG Buffer
 */
export async function generateBarcodeImage(value: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text: value,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
    textsize: 10,
    paddingwidth: 10,
    paddingheight: 5,
  });
}

/**
 * Generate a unique barcode value from product SKU
 */
export function generateBarcodeValue(sku: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `TYS${sku.replace(/[^A-Z0-9]/gi, '').toUpperCase()}${timestamp}`.slice(0, 20);
}
