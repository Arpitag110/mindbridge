import React, { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext(null);

let idCounter = 1;

export function UiProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const [promptState, setPromptState] = useState(null);

    const showToast = useCallback((message, type = "info", timeout = 4000) => {
        const id = idCounter++;
        setToasts((t) => [...t, { id, message, type }]);
        if (timeout > 0) setTimeout(() => setToasts((t) => t.filter(tt => tt.id !== id)), timeout);
    }, []);

    const showConfirm = useCallback((message, title = "Please confirm") => {
        return new Promise((resolve) => {
            setConfirmState({ message, title, resolve });
        });
    }, []);

    const closeConfirm = useCallback((value) => {
        if (confirmState && confirmState.resolve) confirmState.resolve(value);
        setConfirmState(null);
    }, [confirmState]);

    const showPrompt = useCallback((message, placeholder = "", title = "Input") => {
        return new Promise((resolve) => {
            setPromptState({ message, placeholder, title, resolve });
        });
    }, []);

    const closePrompt = useCallback((value) => {
        if (promptState && promptState.resolve) promptState.resolve(value);
        setPromptState(null);
    }, [promptState]);

    return (
        <UIContext.Provider value={{ showToast, showConfirm, showPrompt }}>
            {children}

            {/* Toasts */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
                {toasts.map(t => (
                    <div key={t.id} className={`px-4 py-2 rounded-md shadow-md text-sm max-w-xs ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmState && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg mb-2">{confirmState.title}</h3>
                        <p className="text-sm text-gray-700 mb-4">{confirmState.message}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => closeConfirm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                            <button onClick={() => closeConfirm(true)} className="px-4 py-2 rounded bg-indigo-600 text-white">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt Modal */}
            {promptState && (
                <PromptModal state={promptState} onClose={closePrompt} />
            )}
        </UIContext.Provider>
    );
}

function PromptModal({ state, onClose }) {
    const [val, setVal] = useState("");
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-2">{state.title}</h3>
                <p className="text-sm text-gray-700 mb-3">{state.message}</p>
                <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={state.placeholder} className="w-full border p-2 rounded mb-4" />
                <div className="flex justify-end gap-3">
                    <button onClick={() => onClose(null)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button onClick={() => onClose(val)} className="px-4 py-2 rounded bg-indigo-600 text-white">Submit</button>
                </div>
            </div>
        </div>
    );
}

export const useUI = () => {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useUI must be used within UiProvider");
    return ctx;
};

export default UiProvider;
