import React, { useState, useEffect } from "react";
import { Tag } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

interface PromotionCountdownProps {
    startDate?: string | null;
    endDate?: string | null;
    showStatus?: boolean; // Whether to show status tag
    showCountdown?: boolean; // Whether to show countdown timer
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const PromotionCountdown: React.FC<PromotionCountdownProps> = ({
    startDate,
    endDate,
    showStatus = true,
    showCountdown = true,
}) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
    const [status, setStatus] = useState<"upcoming" | "active" | "expired">("active");

    useEffect(() => {
        const calculateTimeRemaining = (): void => {
            const now = new Date().getTime();
            const start = startDate ? new Date(startDate).getTime() : null;
            const end = endDate ? new Date(endDate).getTime() : null;

            // Determine status
            if (start && now < start) {
                setStatus("upcoming");
                // Calculate time until start
                const diff = start - now;
                setTimeRemaining(calculateTimeDiff(diff));
            } else if (end && now > end) {
                setStatus("expired");
                setTimeRemaining(null);
            } else {
                setStatus("active");
                // If there's an end date, calculate time until end
                if (end) {
                    const diff = end - now;
                    setTimeRemaining(calculateTimeDiff(diff));
                } else {
                    setTimeRemaining(null);
                }
            }
        };

        const calculateTimeDiff = (milliseconds: number): TimeRemaining => {
            const seconds = Math.floor((milliseconds / 1000) % 60);
            const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
            const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
            const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

            return { days, hours, minutes, seconds };
        };

        // Initial calculation
        calculateTimeRemaining();

        // Update every second
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    const renderStatusTag = (): React.ReactNode => {
        if (!showStatus) return null;

        switch (status) {
            case "upcoming":
                return (
                    <Tag icon={<ClockCircleOutlined />} color="blue">
                        Sắp diễn ra
                    </Tag>
                );
            case "active":
                return (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                        Đang diễn ra
                    </Tag>
                );
            case "expired":
                return (
                    <Tag icon={<CloseCircleOutlined />} color="red">
                        Đã kết thúc
                    </Tag>
                );
        }
    };

    const renderCountdown = (): React.ReactNode => {
        if (!showCountdown || !timeRemaining) return null;

        const { days, hours, minutes, seconds } = timeRemaining;

        const countdownText =
            status === "upcoming" ? "Bắt đầu sau: " : "Kết thúc sau: ";

        return (
            <div style={{ fontSize: "14px", color: "#595959", marginTop: "4px" }}>
                <ClockCircleOutlined style={{ marginRight: "4px" }} />
                {countdownText}
                {days > 0 && <span>{days} ngày </span>}
                {hours > 0 && <span>{hours} giờ </span>}
                {minutes > 0 && <span>{minutes} phút </span>}
                {seconds > 0 && <span>{seconds} giây</span>}
            </div>
        );
    };

    const renderDateRange = (): React.ReactNode => {
        if (!startDate && !endDate) {
            return <span style={{ fontSize: "12px", color: "#8c8c8c" }}>Không giới hạn thời gian</span>;
        }

        const formatDate = (dateString: string): string => {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        };

        if (startDate && endDate) {
            return (
                <span style={{ fontSize: "12px", color: "#8c8c8c" }}>
                    {formatDate(startDate)} - {formatDate(endDate)}
                </span>
            );
        } else if (startDate) {
            return (
                <span style={{ fontSize: "12px", color: "#8c8c8c" }}>
                    Từ {formatDate(startDate)}
                </span>
            );
        } else if (endDate) {
            return (
                <span style={{ fontSize: "12px", color: "#8c8c8c" }}>
                    Đến {formatDate(endDate)}
                </span>
            );
        }

        return null;
    };

    return (
        <div>
            {renderStatusTag()}
            {renderCountdown()}
            {renderDateRange()}
        </div>
    );
};

export default PromotionCountdown;
