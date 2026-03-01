import { useState, useEffect } from 'react';

type ToastProps = {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
};

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
    count = (count + 1) % Number.MAX_VALUE;
    return count.toString();
}

type ActionType = {
    addToast: (toast: ToastProps) => void;
};

const listeners: Array<(state: ToastProps | null) => void> = [];

let memoryState: ToastProps | null = null;

function dispatch(toast: ToastProps | null) {
    memoryState = toast;
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

function toast({ ...props }: ToastProps) {
    const id = genId();

    const update = (props: ToastProps) =>
        dispatch({
            ...props,
        });
    const dismiss = () => dispatch(null);

    dispatch({
        ...props,
    });

    return {
        id: id,
        dismiss,
        update,
    };
}

function useToast() {
    const [state, setState] = useState<ToastProps | null>(memoryState);

    useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        toast,
        dismiss: (toastId?: string) => dispatch(null),
        toasts: state ? [state] : [],
    };
}

export { useToast, toast };
