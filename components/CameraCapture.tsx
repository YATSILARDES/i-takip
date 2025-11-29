import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, RefreshCw, Check, Camera } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Arka kamera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
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

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const takePhoto = async () => {
        if (videoRef.current && canvasRef.current && overlayRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const overlay = overlayRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // 1. Video ve Ekran Boyutlarını Al
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                const screenWidth = video.clientWidth;
                const screenHeight = video.clientHeight;

                // 2. Ölçekleme Faktörünü Hesapla (object-fit: cover mantığı)
                const scale = Math.max(screenWidth / videoWidth, screenHeight / videoHeight);

                // 3. Görüntülenen Video Kısmının Boyutları (Sensör üzerinde)
                const visibleWidthOnSensor = screenWidth / scale;
                const visibleHeightOnSensor = screenHeight / scale;

                // 4. Overlay'in Ekrandaki Konumu ve Boyutu
                const overlayRect = overlay.getBoundingClientRect();
                const videoRect = video.getBoundingClientRect();

                // Overlay'in video elementine göre konumu
                const overlayLeft = overlayRect.left - videoRect.left;
                const overlayTop = overlayRect.top - videoRect.top;

                // 5. Kırpılacak Alanın Sensör Üzerindeki Koordinatları
                // Oran orantı: (OverlayBoyutu / EkranBoyutu) * GörünenSensörBoyutu
                const cropX = (overlayLeft / screenWidth) * visibleWidthOnSensor + (videoWidth - visibleWidthOnSensor) / 2;
                const cropY = (overlayTop / screenHeight) * visibleHeightOnSensor + (videoHeight - visibleHeightOnSensor) / 2;
                const cropWidth = (overlayRect.width / screenWidth) * visibleWidthOnSensor;
                const cropHeight = (overlayRect.height / screenHeight) * visibleHeightOnSensor;

                // 6. Canvas Boyutunu Kırpılacak Alana Eşitle
                canvas.width = cropWidth;
                canvas.height = cropHeight;

                // 7. Kırparak Çiz
                context.drawImage(
                    video,
                    cropX, cropY, cropWidth, cropHeight, // Kaynak (Sensör)
                    0, 0, cropWidth, cropHeight          // Hedef (Canvas)
                );

                // 8. Base64'e Çevir (Kaliteyi yüksek tutuyoruz çünkü alan küçük)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleConfirm = async () => {
        if (!capturedImage) return;

        try {
            setIsProcessing(true);

            // Base64 -> File
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            const file = new File([blob], "serial-crop.jpg", { type: "image/jpeg" });

            // Sıkıştırma yapmadan direkt gönderiyoruz (zaten kırpıldığı için boyutu küçük olacaktır)
            onCapture(file);
            onClose();
        } catch (error) {
            console.error("İşlem hatası:", error);
            alert("Fotoğraf işlenirken hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20">
                <h3 className="text-white font-medium drop-shadow-md">Seri No Tara</h3>
                <button onClick={onClose} className="text-white p-2 rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-sm">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main View */}
            <div className="relative w-full h-full bg-black flex items-center justify-center">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay Guide */}
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                            {/* Karartma Arkaplanı */}
                            <div className="absolute inset-0 bg-black/50" />

                            {/* Şeffaf Kırpma Alanı */}
                            <div
                                ref={overlayRef}
                                className="relative w-[85%] max-w-md h-32 border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                            >
                                {/* Köşe İşaretçileri */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1" />

                                {/* Merkez Çizgisi (Opsiyonel) */}
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 transform -translate-y-1/2" />

                                <p className="absolute -top-8 left-0 right-0 text-center text-white/90 text-sm font-medium drop-shadow-md">
                                    Seri numarasını kutucuğa hizalayın
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/90 p-8">
                        <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10" />
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-8 z-20">
                {!capturedImage ? (
                    <button
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all active:scale-95 shadow-lg"
                    >
                        <div className="w-16 h-16 rounded-full bg-white" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-2 text-white hover:text-blue-400 transition-colors"
                        >
                            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium shadow-black drop-shadow-md">Tekrar</span>
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors"
                        >
                            <div className={`p-4 rounded-full ${isProcessing ? 'bg-gray-600' : 'bg-green-600'} shadow-lg shadow-green-900/20`}>
                                {isProcessing ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-6 h-6" />
                                )}
                            </div>
                            <span className="text-sm font-medium shadow-black drop-shadow-md">{isProcessing ? 'İşleniyor...' : 'Kullan'}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;
