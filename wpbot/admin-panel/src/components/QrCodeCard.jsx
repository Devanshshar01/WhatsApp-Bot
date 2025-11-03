import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QrCodeCard({ qrCode }) {
  if (!qrCode) {
    return null;
  }

  return (
    <div className="card">
      <h3>QR Code Pending</h3>
      <p>Scan the QR code with WhatsApp to authenticate the bot.</p>
      <div style={{ background: 'white', padding: '16px', display: 'inline-block' }}>
        <QRCodeCanvas value={qrCode} size={256} />
      </div>
    </div>
  );
}

export default QrCodeCard;
