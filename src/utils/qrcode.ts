import QRCode from "qrcode";

export const generateQR = async (data) => {

  const qr = await QRCode.toDataURL(data);

  return qr;

};