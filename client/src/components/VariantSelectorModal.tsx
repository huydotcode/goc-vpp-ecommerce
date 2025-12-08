import type { ProductVariant } from "@/types/variant.types";
import { formatPrice } from "@/utils/format";
import { Button, Modal, Radio } from "antd";
import React from "react";

interface VariantSelectorModalProps {
  open: boolean;
  variants: ProductVariant[];
  selectedVariantId: number | null;
  selectedQty: number;
  productName: string;
  fallbackImage?: string | null;
  loading?: boolean;
  onClose: () => void;
  onChangeVariant: (variantId: number) => void;
  onChangeQty: (qty: number) => void;
  onConfirm: () => void;
}

const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  open,
  variants,
  selectedVariantId,
  selectedQty,
  productName,
  fallbackImage,
  loading,
  onClose,
  onChangeVariant,
  onChangeQty,
  onConfirm,
}) => {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const defaultVariant =
    variants.find((v) => v.isDefault) ?? variants[0] ?? undefined;
  const priceValue =
    selectedVariant?.price ?? defaultVariant?.price ?? undefined;
  const priceDisplay = priceValue !== undefined ? formatPrice(priceValue) : "—";
  const stockDisplay =
    selectedVariant?.stockQuantity !== undefined &&
    selectedVariant?.stockQuantity !== null
      ? selectedVariant.stockQuantity
      : "—";
  const variantImage = selectedVariant?.imageUrl ?? fallbackImage;
  const variantName =
    selectedVariant?.variantValue === "Default"
      ? "Mặc định"
      : selectedVariant?.variantValue;

  return (
    <Modal
      title="Chọn phân loại"
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
    >
      <div
        style={{ alignItems: "start" }}
        className="grid gap-4 md:gap-4 md:grid-cols-2"
      >
        {/* Cột trái: chỉ hình ảnh */}
        <div
          style={{
            padding: "12px 14px",
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              flexShrink: 0,
              borderRadius: 12,
              overflow: "hidden",
              background: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {variantImage ? (
              <img
                src={variantImage}
                alt={variantName ?? productName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span style={{ fontSize: 18, color: "#999" }}>No image</span>
            )}
          </div>
        </div>

        {/* Cột phải: thông tin + chọn phân loại + số lượng + nút */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: "12px",
              background: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {variantName ?? "Chưa chọn phân loại"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#000" }}>
              {priceDisplay}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>
              Kho: {stockDisplay}
            </div>
          </div>

          <Radio.Group
            style={{ width: "100%" }}
            value={selectedVariantId ?? undefined}
            onChange={(e) => onChangeVariant(e.target.value)}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {variants.map((v) => (
                <Radio.Button
                  key={v.id}
                  value={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    minWidth: 140,
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 600, height: "100%" }}>
                    {v.variantValue === "Default" ? "Mặc định" : v.variantValue}
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>

          <div
            style={{
              padding: "10px 12px",
              background: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  padding: "4px 8px",
                }}
              >
                <Button
                  type="text"
                  style={{ padding: "0 8px" }}
                  onClick={() => onChangeQty(Math.max(1, selectedQty - 1))}
                  disabled={selectedQty <= 1}
                >
                  -
                </Button>
                <span style={{ minWidth: 24, textAlign: "center" }}>
                  {selectedQty}
                </span>
                <Button
                  type="text"
                  style={{ padding: "0 8px" }}
                  onClick={() => {
                    const v = variants.find((x) => x.id === selectedVariantId);
                    const stock = v?.stockQuantity ?? 999;
                    onChangeQty(
                      Math.min(999, Math.min(stock, selectedQty + 1))
                    );
                  }}
                >
                  +
                </Button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Button onClick={onClose}>Hủy</Button>
                <Button type="primary" onClick={onConfirm} loading={loading}>
                  Thêm vào giỏ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VariantSelectorModal;
