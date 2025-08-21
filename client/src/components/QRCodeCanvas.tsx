import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  qrCodeData: string;
  size?: number;
}

export function QRCodeCanvas({ qrCodeData, size = 256 }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrCodeData) {
      QRCode.toCanvas(canvasRef.current, qrCodeData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        }
      });
    }
  }, [qrCodeData, size]);

  if (!qrCodeData) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded" style={{ width: size, height: size }}>
        <p className="text-gray-500 text-sm">لا يوجد رمز QR</p>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef}
      className="border rounded"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}