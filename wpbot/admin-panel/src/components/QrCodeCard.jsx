import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import QRCode from 'qrcode.react';

const QrCodeCard = ({ qrCode }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Scan to connect</Typography>
        {qrCode ? (
          <QRCode value={qrCode} />
        ) : (
          <Typography>Generating QR code...</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeCard;
