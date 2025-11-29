import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Arka kamera öncelikli
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Kamera açılamadı:", err);
            alert("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    }, []);

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const takePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // Canvas boyutunu video boyutuna eşitle
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Çiz
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Base64 olarak al
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setCapturedImage(dataUrl);
                stopCamera(); // Fotoğraf çekince kamerayı durdur
            }
        }
    };

    const handleConfirm = async () => {
        if (!capturedImage) return;

        try {
            setIsCompressing(true);

            // Base64 -> File çevrimi
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            const file = new File([blob], "serial-photo.jpg", { type: "image/jpeg" });

            // Sıkıştırma Ayarları
            const options = {
                maxSizeMB: 0.1, // 100KB altı hedef
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                initialQuality: 0.7
            };

            const compressedFile = await imageCompression(file, options);
            onCapture(compressedFile);
            onClose();
        } catch (error) {
            console.error("Sıkıştırma hatası:", error);
            alert("Fotoğraf işlenirken hata oluştu.");
        } finally {
            setIsCompressing(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                <h3 className="text-white font-medium">Fotoğraf Çek</h3>
                <button onClick={onClose} className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main View */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
                {!capturedImage ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-8">
                {!capturedImage ? (
                    <button
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-full bg-white" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-2 text-white hover:text-blue-400 transition-colors"
                        >
                            <div className="p-4 rounded-full bg-white/10">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <span className="text-sm">Tekrar Çek</span>
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={isCompressing}
                            className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors"
                        >
                            <div className={`p-4 rounded-full ${isCompressing ? 'bg-gray-600' : 'bg-green-600'}`}>
                                {isCompressing ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-6 h-6" />
                                )}
                            </div>
                            <span className="text-sm">{isCompressing ? 'İşleniyor...' : 'Kullan'}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
