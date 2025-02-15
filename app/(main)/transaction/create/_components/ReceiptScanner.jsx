"use client";
import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { Camera, Loader2 } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

const ReceiptScanner = ({ onScanComplete = () => {} }) => {
  const fileInputRef = useRef(null);
  const {
    loading: scanReceiptLoading,
    data: scannedData,
    error: scanReceiptError,
    fn: scanReceiptFn,
  } = useFetch(scanReceipt);
  const handleScanReceipt = async (fileData) => {
    if (fileData.size > 5 * 1024 * 1024) {
      toast.error("File size is too large");
      return;
    }
    await scanReceiptFn(fileData);
  };

  useEffect(() => {
    if (!scanReceiptLoading && scannedData) {
        console.log(scannedData, "scannedData2");
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");
    }
  }, [scanReceiptLoading, scannedData]);

  useEffect(() => {
    if (scanReceiptError && !scanReceiptLoading) {
      toast.error(scanReceiptError);
    }
  }, [scanReceiptError, scanReceiptLoading]);
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleScanReceipt(file);
          }
        }}
      />
      <Button
        type="button"
        className="w-full h-10 bg-gradient-to-br
      from-orange-500 via-pink-500 to-purple-500
      animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white
      
      "
        disabled={scanReceiptLoading}
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2  animate-spin" /> Scanning Receipt...
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;
