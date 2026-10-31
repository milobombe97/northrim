import type { StoredFile } from './files'

const DB_NAME = 'north-rim-files'
const STORE = 'files'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open file storage.'))
  })
}

export function receiptFileKey(clientId: string, transactionId: string) {
  return `receipt:${clientId || 'primary'}:${transactionId}`
}

export type KycFileKind = 'front' | 'back' | 'selfie' | 'proof'

export function kycFileKey(clientId: string, side: KycFileKind) {
  return `kyc:${clientId || 'primary'}:${side}`
}

export function saveStoredFile(key: string, file: StoredFile) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(file, key)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error ?? new Error('Could not store the file.'))
        }
      }),
  )
}

export function loadStoredFile(key: string) {
  return openDb().then(
    (db) =>
      new Promise<StoredFile | null>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const request = tx.objectStore(STORE).get(key)
        request.onsuccess = () => {
          db.close()
          resolve((request.result as StoredFile | undefined) ?? null)
        }
        request.onerror = () => {
          db.close()
          reject(request.error ?? new Error('Could not read the file.'))
        }
      }),
  )
}

export async function findReceiptFile(clientId: string, transactionId: string) {
  const direct = await loadStoredFile(receiptFileKey(clientId, transactionId))
  if (direct?.dataUrl) return direct
  if (clientId !== 'primary') {
    const shared = await loadStoredFile(receiptFileKey('primary', transactionId))
    if (shared?.dataUrl) return shared
  }
  return null
}
