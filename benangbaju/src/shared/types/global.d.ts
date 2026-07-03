export {}

declare global {
  interface MidtransSnap {
    pay: (
      token: string,
      callbacks?: {
        onSuccess?: (result: unknown) => void
        onPending?: (result: unknown) => void
        onError?: (result: unknown) => void
        onClose?: () => void
      }
    ) => void
  }

  interface Window {
    snap?: MidtransSnap
  }
}
