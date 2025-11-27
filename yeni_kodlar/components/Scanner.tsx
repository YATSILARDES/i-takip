import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ];

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: formatsToSupport
          },
          (decodedText) => {
            // Success callback
            html5QrCode.stop().then(() => {
              onScanSuccess(decodedText);
            }).catch(err => console.error(err));
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        );
      } catch (err) {
        console.error("Error starting scanner:", err);
        setError("Kamera başlatılamadı. İzinleri kontrol edin.");
      }
    };

    startScanner();

    // Cleanup
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-md relative bg-black">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 rounded-full text-white hover:bg-slate-700"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
        
        <div className="p-6 text-center text-white">
          <Camera className="w-8 h-8 mx-auto mb-2 text-blue-400 animate-pulse" />
          <p className="text-lg font-medium">Barkod Taranıyor...</p>
          <p className="text-sm text-slate-400 mt-2">Barkodu karenin içine getirin</p>
          {error && <p className="text-red-400 mt-4 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Scanner;