import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  format?: string;
}

const Barcode: React.FC<BarcodeProps> = ({
  value,
  width = 2,
  height = 50,
  displayValue = true,
  format = 'CODE128',
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format,
          width,
          height,
          displayValue: false, // Tắt text trong SVG, chỉ hiển thị barcode
          fontSize: 12,
          margin: 2,
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [value, width, height, format]);

  if (!value) {
    return <span>N/A</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg ref={barcodeRef} />
      {displayValue && <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{value}</span>}
    </div>
  );
};

export default Barcode;

