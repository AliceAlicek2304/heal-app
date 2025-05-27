import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({
    size = 'medium',
    message = 'Đang tải...',
    type = 'default',
    overlay = false,
    color = 'primary'
}) => {
    if (overlay) {
        return (
            <div className={styles.overlay}>
                <div className={styles.overlayContent}>
                    <div className={`${styles.spinner} ${styles[size]} ${styles[type]} ${styles[color]}`}>
                        {type === 'dots' ? (
                            <div className={styles.dotsContainer}>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                            </div>
                        ) : type === 'pulse' ? (
                            <div className={styles.pulseContainer}>
                                <div className={styles.pulseRing}></div>
                                <div className={styles.pulseCore}></div>
                            </div>
                        ) : type === 'wave' ? (
                            <div className={styles.waveContainer}>
                                <div className={styles.waveBar}></div>
                                <div className={styles.waveBar}></div>
                                <div className={styles.waveBar}></div>
                                <div className={styles.waveBar}></div>
                                <div className={styles.waveBar}></div>
                            </div>
                        ) : (
                            <div className={styles.defaultSpinner}>
                                <div className={styles.spinnerCircle}></div>
                            </div>
                        )}
                    </div>
                    {message && <p className={styles.message}>{message}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={`${styles.spinner} ${styles[size]} ${styles[type]} ${styles[color]}`}>
                {type === 'dots' ? (
                    <div className={styles.dotsContainer}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>
                ) : type === 'pulse' ? (
                    <div className={styles.pulseContainer}>
                        <div className={styles.pulseRing}></div>
                        <div className={styles.pulseCore}></div>
                    </div>
                ) : type === 'wave' ? (
                    <div className={styles.waveContainer}>
                        <div className={styles.waveBar}></div>
                        <div className={styles.waveBar}></div>
                        <div className={styles.waveBar}></div>
                        <div className={styles.waveBar}></div>
                        <div className={styles.waveBar}></div>
                    </div>
                ) : type === 'orbit' ? (
                    <div className={styles.orbitContainer}>
                        <div className={styles.orbitCenter}></div>
                        <div className={styles.orbitRing}>
                            <div className={styles.orbitDot}></div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.defaultSpinner}>
                        <div className={styles.spinnerCircle}></div>
                    </div>
                )}
            </div>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
};

export default LoadingSpinner;