import { useEffect } from "react";

/**
 * Custom hook to set up periodic polling.
 * @param {Function} callback - The function to be called at each poll interval.
 * @param {number} interval - The polling interval in milliseconds.
 */
function usePolling(callback, interval = 4000) {
    useEffect(() => {
        // Invoke the callback immediately upon mounting
        callback();

        const timer = setInterval(() => {
            callback();
        }, interval);

        return () => clearInterval(timer); // Cleanup on component unmount
    }, [callback, interval]);
}

export default usePolling;
